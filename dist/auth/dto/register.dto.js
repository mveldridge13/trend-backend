"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: "Please provide a valid email address" }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "First name is required" }),
    (0, class_validator_1.MaxLength)(50, { message: "First name cannot exceed 50 characters" }),
    __metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "Last name is required" }),
    (0, class_validator_1.MaxLength)(50, { message: "Last name cannot exceed 50 characters" }),
    __metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(12, { message: "Password must be at least 12 characters long" }),
    (0, class_validator_1.MaxLength)(128, { message: "Password cannot exceed 128 characters" }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3, { message: "Username must be at least 3 characters" }),
    (0, class_validator_1.MaxLength)(30, { message: "Username cannot exceed 30 characters" }),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores",
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(3, { message: "Currency code cannot exceed 3 characters" }),
    __metadata("design:type", String)
], RegisterDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "timezone", void 0);
//# sourceMappingURL=register.dto.js.map