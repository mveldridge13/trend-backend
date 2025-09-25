import { Module, Global } from '@nestjs/common';
import { DateService } from './services/date.service';
import { CurrencyService } from './services/currency.service';

@Global()
@Module({
  providers: [DateService, CurrencyService],
  exports: [DateService, CurrencyService],
})
export class CommonModule {}