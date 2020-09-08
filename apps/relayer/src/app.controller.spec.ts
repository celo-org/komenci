import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { RelayerService } from './relayer.service'

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [RelayerService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    xit('should return "Hello World!"', () => {
      // expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
