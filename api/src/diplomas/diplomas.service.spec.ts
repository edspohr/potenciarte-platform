import { Test, TestingModule } from '@nestjs/testing';
import { DiplomasService } from './diplomas.service';

describe('DiplomasService', () => {
  let service: DiplomasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiplomasService],
    }).compile();

    service = module.get<DiplomasService>(DiplomasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
