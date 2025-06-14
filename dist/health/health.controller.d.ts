import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): Promise<import("./health.service").HealthStatus>;
    ping(): {
        message: string;
        timestamp: string;
    };
}
