import { Injectable } from "@nestjs/common";
import { Invoice, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const INVOICE_INCLUDE = {
  client: true,
  lineItems: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.InvoiceInclude;

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: typeof INVOICE_INCLUDE;
}>;

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.InvoiceCreateInput,
  ): Promise<InvoiceWithRelations> {
    return this.prisma.invoice.create({
      data,
      include: INVOICE_INCLUDE,
    });
  }

  async findMany(userId: string): Promise<InvoiceWithRelations[]> {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: INVOICE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<InvoiceWithRelations | null> {
    return this.prisma.invoice.findFirst({
      where: { id, userId },
      include: INVOICE_INCLUDE,
    });
  }

  // Returns the most recent invoiceNumber for a user, used to derive the next
  // sequential number. Ordered by createdAt so we get the latest issued.
  async findLatestNumber(userId: string): Promise<string | null> {
    const latest = await this.prisma.invoice.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });
    return latest?.invoiceNumber ?? null;
  }

  // Replaces the invoice's line items and scalar fields in a single
  // transaction so totals and items never drift out of sync.
  async updateWithLineItems(
    id: string,
    userId: string,
    data: Prisma.InvoiceUpdateInput,
    lineItems: Prisma.InvoiceLineItemCreateManyInvoiceInput[],
  ): Promise<InvoiceWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.update({
        where: { id },
        data: {
          ...data,
          lineItems: { createMany: { data: lineItems } },
        },
      });
      return tx.invoice.findFirstOrThrow({
        where: { id, userId },
        include: INVOICE_INCLUDE,
      });
    });
  }

  async update(
    id: string,
    data: Prisma.InvoiceUpdateInput,
  ): Promise<InvoiceWithRelations> {
    return this.prisma.invoice.update({
      where: { id },
      data,
      include: INVOICE_INCLUDE,
    });
  }

  async delete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.invoice.deleteMany({
      where: { id, userId },
    });
  }

  async findByIdRaw(id: string, userId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({ where: { id, userId } });
  }
}
