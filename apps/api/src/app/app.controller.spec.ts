import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it } from 'vitest';

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
                        getData: () => ({ message: 'ok' }),
                        pingAuth: () => ({ message: 'pong' }),
                        registerAuth: () => ({}),
                        loginAuth: () => ({}),
                        refreshAuth: () => ({}),
                        logoutAuth: () => ({}),
                        validateAccessToken: () => ({}),
                    },
                },
            ],
        }).compile();
    });

    describe('getData', () => {
        it('should proxy getData', () => {
            const appController = app.get<AppController>(AppController);
            expect(appController.getData()).toEqual({ message: 'ok' });
        });
    });
});
