import { Test, TestingModule } from '@nestjs/testing';
import { SafetyNetService } from './safety-net.service';
import { AppModule } from '../../app.module';
import { HttpModule } from '@nestjs/common';

describe('SafetyNetService', () => {
  let service: SafetyNetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, HttpModule],
      providers: [SafetyNetService],
    }).compile();

    service = module.get<SafetyNetService>(SafetyNetService);
  });

  it('should be true when the attestation is valid', async () => {
    const result = {isValidSignature: true};
    jest.spyOn(service, 'verifyDevice').mockImplementation(async () => result);

    expect((await service.verifyDevice({signedAttestation:"valid"})).isValidSignature).toBe(true);
  });

  it('should be false when the attestation is invalid', async () => {
    const result = {isValidSignature: false};
    jest.spyOn(service, 'verifyDevice').mockImplementation(async () => result);

    expect((await service.verifyDevice({signedAttestation:"invalid"})).isValidSignature).toBe(false);
  });
});
