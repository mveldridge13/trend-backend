import { HomeService } from './home.service';
import { HomeSummaryResponse } from './dto/home-summary.dto';
export declare class HomeController {
    private readonly homeService;
    constructor(homeService: HomeService);
    getSummary(req: any): Promise<HomeSummaryResponse>;
}
