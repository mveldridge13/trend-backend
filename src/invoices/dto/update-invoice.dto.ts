import { PartialType, OmitType } from "@nestjs/swagger";
import { CreateInvoiceDto } from "./create-invoice.dto";

// clientId is fixed once an invoice is created; everything else is editable
// while the invoice is still a draft.
export class UpdateInvoiceDto extends PartialType(
  OmitType(CreateInvoiceDto, ["clientId"] as const),
) {}
