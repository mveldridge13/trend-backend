import { Module, Global } from "@nestjs/common";
import { AuditService } from "./audit.service";

@Global() // Make available throughout the app without importing
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
