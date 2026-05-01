/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { AppConfigService } from '@nam088/config';
import { createAuthGrpcServerOptions } from '@nam088/grpc';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { GrpcLoggingInterceptor } from './app/interceptors/grpc-logging.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const appConfigService = app.get(AppConfigService);
    const grpcEndpoint = appConfigService.getAuthGrpcEndpoint();
    app.useGlobalInterceptors(app.get(GrpcLoggingInterceptor));
    app.connectMicroservice(createAuthGrpcServerOptions(__dirname, grpcEndpoint), {
        inheritAppConfig: true,
    });

    await app.startAllMicroservices();
    await app.init();
    Logger.log(`🚀 AUTH gRPC is running on: ${appConfigService.getAuthGrpcUrl()}`);
}

bootstrap();
