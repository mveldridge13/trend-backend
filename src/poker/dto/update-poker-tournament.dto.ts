import { PartialType } from "@nestjs/mapped-types";
import { CreatePokerTournamentDto } from "./create-poker-tournament.dto";

export class UpdatePokerTournamentDto extends PartialType(CreatePokerTournamentDto) {}