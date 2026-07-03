import { Module } from "@nestjs/common";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { InvoicesRepository } from "./repositories/invoices.repository";
import { ClientsRepository } from "./repositories/clients.repository";
import { InvoicePdfService } from "./invoice-pdf.service";
import { UsersRepository } from "../users/repositories/users.repository";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoicesRepository,
    ClientsRepository,
    InvoicePdfService,
    UsersRepository,
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
