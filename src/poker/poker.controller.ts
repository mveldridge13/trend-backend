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
import { PokerService } from "./poker.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreatePokerTournamentDto } from "./dto/create-poker-tournament.dto";
import { UpdatePokerTournamentDto } from "./dto/update-poker-tournament.dto";
import { CreatePokerTournamentEventDto } from "./dto/create-poker-tournament-event.dto";
import { UpdatePokerTournamentEventDto } from "./dto/update-poker-tournament-event.dto";
import {
  PokerTournamentDto,
  PokerTournamentEventDto,
} from "./dto/poker-tournament.dto";
import {
  PokerAnalyticsDto,
  TournamentAnalyticsDto,
} from "./dto/poker-analytics.dto";

@Controller("poker")
@UseGuards(JwtAuthGuard)
export class PokerController {
  constructor(private readonly pokerService: PokerService) {}

  private extractUserId(req: any): string {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new Error("User ID not found in request");
    }

    return userId;
  }

  // Tournament Management
  @Post("tournaments")
  @HttpCode(HttpStatus.CREATED)
  async createTournament(
    @Request() req: any,
    @Body(ValidationPipe) createTournamentDto: CreatePokerTournamentDto,
  ): Promise<PokerTournamentDto> {
    const userId = this.extractUserId(req);
    return this.pokerService.createTournament(userId, createTournamentDto);
  }

  @Get("tournaments")
  async getTournaments(@Request() req: any): Promise<PokerTournamentDto[]> {
    const userId = this.extractUserId(req);
    return this.pokerService.getTournaments(userId);
  }

  @Get("tournaments/:id")
  async getTournamentById(
    @Request() req: any,
    @Param("id") id: string,
  ): Promise<PokerTournamentDto> {
    const userId = this.extractUserId(req);
    return this.pokerService.getTournamentById(id, userId);
  }

  @Put("tournaments/:id")
  async updateTournament(
    @Request() req: any,
    @Param("id") id: string,
    @Body(ValidationPipe) updateTournamentDto: UpdatePokerTournamentDto,
  ): Promise<PokerTournamentDto> {
    const userId = this.extractUserId(req);
    return this.pokerService.updateTournament(id, userId, updateTournamentDto);
  }

  @Delete("tournaments/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTournament(
    @Request() req: any,
    @Param("id") id: string,
  ): Promise<void> {
    const userId = this.extractUserId(req);
    return this.pokerService.deleteTournament(id, userId);
  }

  // Tournament Events Management
  @Post("tournaments/:tournamentId/events")
  @HttpCode(HttpStatus.CREATED)
  async createTournamentEvent(
    @Request() req: any,
    @Param("tournamentId") tournamentId: string,
    @Body(ValidationPipe) createEventDto: CreatePokerTournamentEventDto,
  ): Promise<PokerTournamentEventDto> {
    const userId = this.extractUserId(req);
    return this.pokerService.createTournamentEvent(
      tournamentId,
      userId,
      createEventDto,
    );
  }

  @Get("tournaments/:tournamentId/events")
  async getTournamentEvents(
    @Request() req: any,
    @Param("tournamentId") tournamentId: string,
  ): Promise<PokerTournamentEventDto[]> {
    const userId = this.extractUserId(req);
    return this.pokerService.getTournamentEvents(tournamentId, userId);
  }

  @Put("tournaments/events/:eventId")
  async updateTournamentEvent(
    @Request() req: any,
    @Param("eventId") eventId: string,
    @Body(ValidationPipe) updateEventDto: UpdatePokerTournamentEventDto,
  ): Promise<PokerTournamentEventDto> {
    const userId = this.extractUserId(req);
    return this.pokerService.updateTournamentEvent(
      eventId,
      userId,
      updateEventDto,
    );
  }

  @Delete("tournaments/events/:eventId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTournamentEvent(
    @Request() req: any,
    @Param("eventId") eventId: string,
  ): Promise<void> {
    const userId = this.extractUserId(req);
    return this.pokerService.deleteTournamentEvent(eventId, userId);
  }

  // Analytics Endpoints
  @Get("analytics")
  async getPokerAnalytics(@Request() req: any): Promise<PokerAnalyticsDto> {
    const userId = this.extractUserId(req);
    return this.pokerService.getPokerAnalytics(userId);
  }

  @Get("tournaments/:id/analytics")
  async getTournamentAnalytics(
    @Request() req: any,
    @Param("id") id: string,
  ): Promise<TournamentAnalyticsDto> {
    const userId = this.extractUserId(req);
    return this.pokerService.getTournamentAnalytics(id, userId);
  }
}