/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { AppConfigService } from '@nam088/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';
import { GrpcProxyExceptionFilter } from './app/filters/grpc-proxy-exception.filter';
import { HttpExceptionFilter } from './app/filters/http-exception.filter';
import { HttpLoggingInterceptor } from './app/interceptors/http-logging.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const globalPrefix = 'api';
    const swaggerPath = `${globalPrefix}/docs`;
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    app.useGlobalInterceptors(app.get(HttpLoggingInterceptor));
    app.useGlobalFilters(new GrpcProxyExceptionFilter(), new HttpExceptionFilter());

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Nam088 API')
        .setDescription('HTTP gateway API documentation')
        .setVersion('1.0.0')
        .addBearerAuth(undefined, 'bearer')
        .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, swaggerDocument, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    const appConfigService = app.get(AppConfigService);
    const port = appConfigService.getPort();
    await app.listen(port);
    Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
    Logger.log(`📘 Swagger docs: http://localhost:${port}/${swaggerPath}`);
}

bootstrap();
