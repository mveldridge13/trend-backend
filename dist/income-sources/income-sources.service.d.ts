import { PrismaService } from "../database/prisma.service";
import { DateService } from "../common/services/date.service";
import { IncomeSource } from "@prisma/client";
import { CreateIncomeSourceDto } from "./dto/create-income-source.dto";
import { UpdateIncomeSourceDto } from "./dto/update-income-source.dto";
export interface IncomeSourceResponse {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    nextPaymentDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export declare class IncomeSourcesService {
    private readonly prisma;
    private readonly dateService;
    private readonly logger;
    private static readonly MAX_OCCURRENCES_PER_RUN;
    constructor(prisma: PrismaService, dateService: DateService);
    findAll(userId: string): Promise<IncomeSourceResponse[]>;
    create(userId: string, dto: CreateIncomeSourceDto): Promise<IncomeSourceResponse>;
    update(userId: string, id: string, dto: UpdateIncomeSourceDto): Promise<IncomeSourceResponse>;
    remove(userId: string, id: string): Promise<void>;
    findOwned(userId: string, id: string): Promise<IncomeSource>;
    materializeDueTransactions(userId: string, userTimezone: string): Promise<number>;
    private toResponse;
}
