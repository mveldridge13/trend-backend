import { PartialType } from "@nestjs/mapped-types";
import { CreatePokerTournamentEventDto } from "./create-poker-tournament-event.dto";

export class UpdatePokerTournamentEventDto extends PartialType(CreatePokerTournamentEventDto) {}