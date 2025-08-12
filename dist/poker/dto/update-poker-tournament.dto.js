"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePokerTournamentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_poker_tournament_dto_1 = require("./create-poker-tournament.dto");
class UpdatePokerTournamentDto extends (0, mapped_types_1.PartialType)(create_poker_tournament_dto_1.CreatePokerTournamentDto) {
}
exports.UpdatePokerTournamentDto = UpdatePokerTournamentDto;
//# sourceMappingURL=update-poker-tournament.dto.js.map