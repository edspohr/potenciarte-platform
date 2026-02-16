import { Module } from '@nestjs/common';
import { DiplomasController } from './diplomas.controller';
import { DiplomasService } from './diplomas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../common/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [DiplomasController],
  providers: [DiplomasService],
})
export class DiplomasModule {}
