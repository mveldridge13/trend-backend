import { InvoiceStatus } from "@prisma/client";
import { ClientDto } from "./client.dto";

export class InvoiceLineItemDto {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  amount: number;
  sortOrder: number;
}

export class InvoiceDto {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  sentAt?: string | null;
  paidAt?: string | null;
  transactionId?: string | null;
  clientId: string;
  client?: ClientDto;
  lineItems: InvoiceLineItemDto[];
  createdAt: string;
  updatedAt: string;
}
