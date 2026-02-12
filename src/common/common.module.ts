import { Module, Global } from '@nestjs/common';
import { DateService } from './services/date.service';
import { CurrencyService } from './services/currency.service';
import { HibpService } from './services/hibp.service';
import { SecretsService } from './services/secrets.service';

@Global()
@Module({
  providers: [DateService, CurrencyService, HibpService, SecretsService],
  exports: [DateService, CurrencyService, HibpService, SecretsService],
})
export class CommonModule {}