import { PrismaService } from "../../database/prisma.service";
import { Transaction } from "@prisma/client";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import { UpdateTransactionDto } from "../dto/update-transaction.dto";
import { TransactionFilterDto } from "../dto/transaction-filter.dto";
export declare class TransactionsRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, data: CreateTransactionDto): Promise<Transaction>;
    findMany(userId: string, filters: TransactionFilterDto): Promise<Transaction[]>;
    findById(id: string, userId: string): Promise<Transaction | null>;
    update(id: string, userId: string, data: UpdateTransactionDto): Promise<Transaction>;
    delete(id: string, userId: string): Promise<Transaction>;
    count(userId: string, filters?: Partial<TransactionFilterDto>): Promise<number>;
}
