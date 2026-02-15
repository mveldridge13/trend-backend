import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HomeService } from './home.service';
import { HomeSummaryResponse } from './dto/home-summary.dto';

@Controller('home')
@UseGuards(JwtAuthGuard)
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  /**
   * GET /home/summary
   *
   * Returns the complete balance card summary for the current pay period.
   * This is the single source of truth for both mobile and web.
   *
   * Response includes:
   * - period: start/end dates, frequency, days remaining
   * - income: base income, additional income, rollover
   * - outflows: committed, discretionary, goals
   * - totals: total expenses spent, left to spend (safe)
   */
  @Get('summary')
  async getSummary(@Request() req): Promise<HomeSummaryResponse> {
    return this.homeService.getSummary(req.user.id);
  }
}
