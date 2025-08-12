"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePokerTournamentEventDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_poker_tournament_event_dto_1 = require("./create-poker-tournament-event.dto");
class UpdatePokerTournamentEventDto extends (0, mapped_types_1.PartialType)(create_poker_tournament_event_dto_1.CreatePokerTournamentEventDto) {
}
exports.UpdatePokerTournamentEventDto = UpdatePokerTournamentEventDto;
//# sourceMappingURL=update-poker-tournament-event.dto.js.map