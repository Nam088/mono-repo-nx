/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { AppConfigService } from '@nam088/config';
import { createAuthGrpcServerOptions } from '@nam088/grpc';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    const appConfigService = app.get(AppConfigService);
    const port = appConfigService.getPort(3002);
    const grpcEndpoint = appConfigService.getAuthGrpcEndpoint();
    app.connectMicroservice(createAuthGrpcServerOptions(__dirname, grpcEndpoint));

    await app.startAllMicroservices();
    await app.listen(port);
    Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
    Logger.log(`🚀 AUTH gRPC is running on: ${appConfigService.getAuthGrpcUrl()}`);
}

bootstrap();
