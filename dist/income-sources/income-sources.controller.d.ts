import { IncomeSourcesService } from "./income-sources.service";
import { CreateIncomeSourceDto } from "./dto/create-income-source.dto";
import { UpdateIncomeSourceDto } from "./dto/update-income-source.dto";
export declare class IncomeSourcesController {
    private readonly incomeSourcesService;
    constructor(incomeSourcesService: IncomeSourcesService);
    private extractUserId;
    findAll(req: any): Promise<import("./income-sources.service").IncomeSourceResponse[]>;
    create(req: any, dto: CreateIncomeSourceDto): Promise<import("./income-sources.service").IncomeSourceResponse>;
    update(req: any, id: string, dto: UpdateIncomeSourceDto): Promise<import("./income-sources.service").IncomeSourceResponse>;
    remove(req: any, id: string): Promise<void>;
    dismissRolloverNotification(req: any, id: string): Promise<void>;
}
