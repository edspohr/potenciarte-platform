import { Module } from '@nestjs/common';
import { DiplomasController } from './diplomas.controller';
import { DiplomasService } from './diplomas.service';
import { EmailModule } from '../common/email.module';

@Module({
  imports: [EmailModule],
  controllers: [DiplomasController],
  providers: [DiplomasService],
})
export class DiplomasModule {}
