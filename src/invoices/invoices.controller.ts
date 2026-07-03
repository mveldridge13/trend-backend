import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";

@Controller("invoices")
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  private extractUserId(req: any): string {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new Error("User ID not found in request");
    }
    return userId;
  }

  // --- Clients ---
  // Note: client routes are declared before "/:id" invoice routes so the
  // literal "clients" segment isn't captured as an invoice id.

  @Post("clients")
  @HttpCode(HttpStatus.CREATED)
  async createClient(
    @Request() req: any,
    @Body(ValidationPipe) dto: CreateClientDto,
  ) {
    return this.invoicesService.createClient(this.extractUserId(req), dto);
  }

  @Get("clients")
  async findAllClients(@Request() req: any) {
    return this.invoicesService.findAllClients(this.extractUserId(req));
  }

  @Get("clients/:id")
  async findClient(@Request() req: any, @Param("id") id: string) {
    return this.invoicesService.findClient(this.extractUserId(req), id);
  }

  @Put("clients/:id")
  async updateClient(
    @Request() req: any,
    @Param("id") id: string,
    @Body(ValidationPipe) dto: UpdateClientDto,
  ) {
    return this.invoicesService.updateClient(this.extractUserId(req), id, dto);
  }

  @Delete("clients/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeClient(@Request() req: any, @Param("id") id: string) {
    await this.invoicesService.removeClient(this.extractUserId(req), id);
  }

  // --- Invoices ---

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(
    @Request() req: any,
    @Body(ValidationPipe) dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.createInvoice(this.extractUserId(req), dto);
  }

  @Get()
  async findAllInvoices(@Request() req: any) {
    return this.invoicesService.findAllInvoices(this.extractUserId(req));
  }

  @Get(":id")
  async findInvoice(@Request() req: any, @Param("id") id: string) {
    return this.invoicesService.findInvoice(this.extractUserId(req), id);
  }

  @Put(":id")
  async updateInvoice(
    @Request() req: any,
    @Param("id") id: string,
    @Body(ValidationPipe) dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.updateInvoice(this.extractUserId(req), id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeInvoice(@Request() req: any, @Param("id") id: string) {
    await this.invoicesService.removeInvoice(this.extractUserId(req), id);
  }

  @Post(":id/void")
  @HttpCode(HttpStatus.OK)
  async voidInvoice(@Request() req: any, @Param("id") id: string) {
    return this.invoicesService.voidInvoice(this.extractUserId(req), id);
  }

  @Post(":id/send")
  @HttpCode(HttpStatus.OK)
  async sendInvoice(@Request() req: any, @Param("id") id: string) {
    return this.invoicesService.sendInvoice(this.extractUserId(req), id);
  }

  @Post(":id/pay")
  @HttpCode(HttpStatus.OK)
  async payInvoice(@Request() req: any, @Param("id") id: string) {
    return this.invoicesService.payInvoice(this.extractUserId(req), id);
  }
}
