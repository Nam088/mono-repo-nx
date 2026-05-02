import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                {
                    provide: AppService,
                    useValue: {
                        getData: vi.fn(async () => ({ message: 'ok' })),
                    },
                },
            ],
        }).compile();
    });

    describe('getData', () => {
        it('should proxy getData', async () => {
            const appController = app.get<AppController>(AppController);
            await expect(appController.getData()).resolves.toEqual({ message: 'ok' });
        });
    });
});
