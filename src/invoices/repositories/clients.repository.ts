import { Injectable } from "@nestjs/common";
import { Client, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    data: Omit<Prisma.ClientCreateInput, "user">,
  ): Promise<Client> {
    return this.prisma.client.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async findMany(userId: string): Promise<Client[]> {
    return this.prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string, userId: string): Promise<Client | null> {
    return this.prisma.client.findFirst({
      where: { id, userId },
    });
  }

  async update(
    id: string,
    userId: string,
    data: Prisma.ClientUpdateInput,
  ): Promise<Prisma.BatchPayload> {
    // updateMany lets us scope by userId for ownership safety
    return this.prisma.client.updateMany({
      where: { id, userId },
      data,
    });
  }

  async delete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.client.deleteMany({
      where: { id, userId },
    });
  }

  async countInvoices(clientId: string, userId: string): Promise<number> {
    return this.prisma.invoice.count({
      where: { clientId, userId },
    });
  }
}
