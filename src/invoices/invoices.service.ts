import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Prisma, InvoiceStatus, TransactionType } from "@prisma/client";
import { ClientsRepository } from "./repositories/clients.repository";
import {
  InvoicesRepository,
  InvoiceWithRelations,
} from "./repositories/invoices.repository";
import { UsersRepository } from "../users/repositories/users.repository";
import { PrismaService } from "../database/prisma.service";
import { EmailService } from "../email/email.service";
import { InvoicePdfService } from "./invoice-pdf.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import {
  CreateInvoiceDto,
  CreateInvoiceLineItemDto,
} from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { ClientDto } from "./dto/client.dto";
import { InvoiceDto } from "./dto/invoice.dto";

const INVOICE_NUMBER_PREFIX = "INV-";
const INVOICE_NUMBER_PAD = 4;
const FREELANCE_CATEGORY_NAME = "Freelance Income";

// Editing line items / financial fields is only allowed while the invoice is
// still a draft. Once sent or paid it is locked to preserve what the client saw.
const EDITABLE_STATUSES: InvoiceStatus[] = [InvoiceStatus.DRAFT];

@Injectable()
export class InvoicesService {
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly invoicesRepository: InvoicesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly pdfService: InvoicePdfService,
  ) {}

  // ---------------------------------------------------------------------------
  // Clients
  // ---------------------------------------------------------------------------

  async createClient(
    userId: string,
    dto: CreateClientDto,
  ): Promise<ClientDto> {
    const client = await this.clientsRepository.create(userId, { ...dto });
    return this.mapClient(client);
  }

  async findAllClients(userId: string): Promise<ClientDto[]> {
    const clients = await this.clientsRepository.findMany(userId);
    return clients.map((c) => this.mapClient(c));
  }

  async findClient(userId: string, id: string): Promise<ClientDto> {
    const client = await this.clientsRepository.findById(id, userId);
    if (!client) {
      throw new NotFoundException("Client not found");
    }
    return this.mapClient(client);
  }

  async updateClient(
    userId: string,
    id: string,
    dto: UpdateClientDto,
  ): Promise<ClientDto> {
    const result = await this.clientsRepository.update(id, userId, { ...dto });
    if (result.count === 0) {
      throw new NotFoundException("Client not found");
    }
    return this.findClient(userId, id);
  }

  async removeClient(userId: string, id: string): Promise<void> {
    const invoiceCount = await this.clientsRepository.countInvoices(id, userId);
    if (invoiceCount > 0) {
      throw new BadRequestException(
        "Cannot delete a client that has invoices. Delete the invoices first.",
      );
    }
    const result = await this.clientsRepository.delete(id, userId);
    if (result.count === 0) {
      throw new NotFoundException("Client not found");
    }
  }

  // ---------------------------------------------------------------------------
  // Invoices
  // ---------------------------------------------------------------------------

  async createInvoice(
    userId: string,
    dto: CreateInvoiceDto,
  ): Promise<InvoiceDto> {
    const client = await this.clientsRepository.findById(dto.clientId, userId);
    if (!client) {
      throw new NotFoundException("Client not found");
    }

    const user = await this.usersRepository.findById(userId);
    const currency = dto.currency || user?.currency || "USD";

    const { lineItems, totals } = this.computeLineItems(dto.lineItems);
    const invoiceNumber = await this.generateInvoiceNumber(userId);

    const invoice = await this.invoicesRepository.create({
      invoiceNumber,
      currency,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      notes: dto.notes,
      terms: dto.terms,
      ...totals,
      user: { connect: { id: userId } },
      client: { connect: { id: client.id } },
      lineItems: { createMany: { data: lineItems } },
    });

    return this.mapInvoice(invoice);
  }

  async findAllInvoices(userId: string): Promise<InvoiceDto[]> {
    const invoices = await this.invoicesRepository.findMany(userId);
    return invoices.map((i) => this.mapInvoice(i));
  }

  async findInvoice(userId: string, id: string): Promise<InvoiceDto> {
    const invoice = await this.getOwnedInvoice(userId, id);
    return this.mapInvoice(invoice);
  }

  async updateInvoice(
    userId: string,
    id: string,
    dto: UpdateInvoiceDto,
  ): Promise<InvoiceDto> {
    const existing = await this.getOwnedInvoice(userId, id);
    if (!EDITABLE_STATUSES.includes(existing.status)) {
      throw new BadRequestException(
        `Only draft invoices can be edited (this one is ${existing.status}).`,
      );
    }

    const data: Prisma.InvoiceUpdateInput = {};
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.issueDate !== undefined) data.issueDate = new Date(dto.issueDate);
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.terms !== undefined) data.terms = dto.terms;

    // If line items change, recompute totals and replace them atomically.
    if (dto.lineItems !== undefined) {
      const { lineItems, totals } = this.computeLineItems(dto.lineItems);
      const updated = await this.invoicesRepository.updateWithLineItems(
        id,
        userId,
        { ...data, ...totals },
        lineItems,
      );
      return this.mapInvoice(updated);
    }

    const updated = await this.invoicesRepository.update(id, data);
    return this.mapInvoice(updated);
  }

  // Only draft invoices can be hard-deleted. A sent invoice is a document the
  // client already holds and its number must stay in the sequence for audit, so
  // it must be voided (see voidInvoice) rather than deleted.
  async removeInvoice(userId: string, id: string): Promise<void> {
    const invoice = await this.getOwnedInvoice(userId, id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        "Only draft invoices can be deleted. Void a sent invoice instead.",
      );
    }
    const result = await this.invoicesRepository.delete(id, userId);
    if (result.count === 0) {
      throw new NotFoundException("Invoice not found");
    }
  }

  // Voids (cancels) an invoice while preserving the row and its number for the
  // audit trail — the industry-standard alternative to deleting a sent invoice.
  // Notifies the client with a cancellation email if the invoice had been sent.
  async voidInvoice(userId: string, id: string): Promise<InvoiceDto> {
    const invoice = await this.getOwnedInvoice(userId, id);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException(
        "Cannot void a paid invoice. The payment has already been recorded.",
      );
    }
    if (invoice.status === InvoiceStatus.CANCELED) {
      throw new BadRequestException("Invoice is already voided.");
    }

    const updated = await this.invoicesRepository.update(id, {
      status: InvoiceStatus.CANCELED,
    });

    // Notify the client only if they actually received the invoice. Voiding a
    // draft (never sent) skips the email. Best-effort: a failed notice doesn't
    // roll back the void — the invoice is already cancelled on our side.
    if (invoice.sentAt) {
      const user = await this.usersRepository.findById(userId);
      if (user) {
        const senderName = `${user.firstName} ${user.lastName}`.trim();
        await this.emailService.sendInvoiceCancellationEmail(
          invoice.client.email,
          {
            invoiceNumber: invoice.invoiceNumber,
            senderName,
            replyTo: user.email,
            total: `${invoice.currency} ${Number(invoice.total).toFixed(2)}`,
          },
        );
      }
    }

    return this.mapInvoice(updated);
  }

  // ---------------------------------------------------------------------------
  // Send
  // ---------------------------------------------------------------------------

  async sendInvoice(userId: string, id: string): Promise<InvoiceDto> {
    const invoice = await this.getOwnedInvoice(userId, id);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException("This invoice has already been paid.");
    }
    if (invoice.status === InvoiceStatus.CANCELED) {
      throw new BadRequestException("This invoice has been canceled.");
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const senderName = `${user.firstName} ${user.lastName}`.trim();

    const pdf = await this.pdfService.generate(invoice, {
      name: senderName,
      email: user.email,
    });

    const sent = await this.emailService.sendInvoiceEmail(
      invoice.client.email,
      {
        invoiceNumber: invoice.invoiceNumber,
        senderName,
        replyTo: user.email,
        total: `${invoice.currency} ${Number(invoice.total).toFixed(2)}`,
        dueDate: invoice.dueDate.toISOString().split("T")[0],
        pdf,
      },
    );

    if (!sent) {
      throw new BadRequestException(
        "Failed to send the invoice email. Please try again.",
      );
    }

    const updated = await this.invoicesRepository.update(id, {
      status: InvoiceStatus.SENT,
      sentAt: new Date(),
    });
    return this.mapInvoice(updated);
  }

  // ---------------------------------------------------------------------------
  // Mark paid  →  creates the INCOME Transaction
  // ---------------------------------------------------------------------------

  async payInvoice(userId: string, id: string): Promise<InvoiceDto> {
    const invoice = await this.markInvoicePaid(userId, id);
    return this.mapInvoice(invoice);
  }

  /**
   * Single source of truth for transitioning an invoice to PAID and creating
   * the matching INCOME Transaction. Manual mark-paid calls it today; a future
   * Stripe webhook can call it with `stripePaymentId` without changing the
   * money-creating logic.
   *
   * Idempotent: if the invoice already has a linked transactionId we return it
   * untouched, so a manual mark-paid and a webhook can never double-count.
   */
  private async markInvoicePaid(
    userId: string,
    id: string,
    opts: { stripePaymentId?: string } = {},
  ): Promise<InvoiceWithRelations> {
    const invoice = await this.getOwnedInvoice(userId, id);

    if (invoice.status === InvoiceStatus.CANCELED) {
      throw new BadRequestException("Cannot pay a canceled invoice.");
    }

    // Idempotency guard.
    if (invoice.transactionId) {
      return invoice;
    }

    const categoryId = await this.getOrCreateFreelanceCategory(userId);
    const paidAt = new Date();

    // Create the income Transaction and link it back to the invoice in one
    // atomic transaction so we never end up with income but an unpaid invoice.
    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          description: `Invoice ${invoice.invoiceNumber} - ${invoice.client.name}`,
          amount: new Prisma.Decimal(invoice.total),
          currency: invoice.currency,
          date: paidAt,
          type: TransactionType.INCOME,
          categoryId,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt,
          transactionId: transaction.id,
          ...(opts.stripePaymentId
            ? { stripePaymentId: opts.stripePaymentId }
            : {}),
        },
      });
    });

    const updated = await this.invoicesRepository.findById(id, userId);
    if (!updated) {
      throw new NotFoundException("Invoice not found");
    }
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async getOwnedInvoice(
    userId: string,
    id: string,
  ): Promise<InvoiceWithRelations> {
    const invoice = await this.invoicesRepository.findById(id, userId);
    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }
    return invoice;
  }

  // Finds or creates the per-user "Freelance Income" category used to tag
  // invoice payments. The schema's unique([name, userId, isSystem, parentId])
  // makes this safe to upsert.
  private async getOrCreateFreelanceCategory(userId: string): Promise<string> {
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: FREELANCE_CATEGORY_NAME,
        type: "INCOME",
      },
    });
    if (existing) {
      return existing.id;
    }
    const created = await this.prisma.category.create({
      data: {
        userId,
        name: FREELANCE_CATEGORY_NAME,
        type: "INCOME",
        icon: "receipt",
        color: "#10B981",
      },
    });
    return created.id;
  }

  // Sequential per-user numbering: INV-0001, INV-0002, ...
  private async generateInvoiceNumber(userId: string): Promise<string> {
    const latest = await this.invoicesRepository.findLatestNumber(userId);
    let next = 1;
    if (latest?.startsWith(INVOICE_NUMBER_PREFIX)) {
      const parsed = parseInt(latest.slice(INVOICE_NUMBER_PREFIX.length), 10);
      if (!Number.isNaN(parsed)) {
        next = parsed + 1;
      }
    }
    return `${INVOICE_NUMBER_PREFIX}${String(next).padStart(INVOICE_NUMBER_PAD, "0")}`;
  }

  // Computes per-line amounts and invoice-level totals with Decimal precision.
  // Per line: base = qty * unitPrice; discounted = base - discount;
  // tax = discounted * taxRate%; amount = discounted + tax.
  private computeLineItems(items: CreateInvoiceLineItemDto[]): {
    lineItems: Prisma.InvoiceLineItemCreateManyInvoiceInput[];
    totals: {
      subtotal: Prisma.Decimal;
      discountTotal: Prisma.Decimal;
      taxTotal: Prisma.Decimal;
      total: Prisma.Decimal;
    };
  } {
    const D = (v: number | string) => new Prisma.Decimal(v);
    let subtotal = D(0);
    let discountTotal = D(0);
    let taxTotal = D(0);

    const lineItems = items.map((item, index) => {
      const quantity = D(item.quantity);
      const unitPrice = D(item.unitPrice);
      const discount = D(item.discount ?? 0);
      const taxRate = D(item.taxRate ?? 0);

      const base = quantity.mul(unitPrice);
      const discounted = base.sub(discount);
      const tax = discounted.mul(taxRate).div(100);
      const amount = discounted.add(tax);

      subtotal = subtotal.add(base);
      discountTotal = discountTotal.add(discount);
      taxTotal = taxTotal.add(tax);

      return {
        description: item.description,
        quantity,
        unitPrice,
        taxRate,
        discount,
        amount: this.round(amount),
        sortOrder: index,
      };
    });

    return {
      lineItems,
      totals: {
        subtotal: this.round(subtotal),
        discountTotal: this.round(discountTotal),
        taxTotal: this.round(taxTotal),
        total: this.round(subtotal.sub(discountTotal).add(taxTotal)),
      },
    };
  }

  private round(value: Prisma.Decimal): Prisma.Decimal {
    return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  private mapClient(client: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    address: string | null;
    phone: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ClientDto {
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company,
      address: client.address,
      phone: client.phone,
      notes: client.notes,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  private mapInvoice(invoice: InvoiceWithRelations): InvoiceDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      currency: invoice.currency,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      subtotal: Number(invoice.subtotal),
      taxTotal: Number(invoice.taxTotal),
      discountTotal: Number(invoice.discountTotal),
      total: Number(invoice.total),
      notes: invoice.notes,
      terms: invoice.terms,
      sentAt: invoice.sentAt ? invoice.sentAt.toISOString() : null,
      paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
      transactionId: invoice.transactionId,
      clientId: invoice.clientId,
      client: this.mapClient(invoice.client),
      lineItems: invoice.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        taxRate: Number(li.taxRate),
        discount: Number(li.discount),
        amount: Number(li.amount),
        sortOrder: li.sortOrder,
      })),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }
}
