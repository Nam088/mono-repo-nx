import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from './env.schema';

export type DatabaseEnv = Pick<
    Env,
    'POSTGRES_HOST' | 'POSTGRES_PORT' | 'POSTGRES_DB' | 'POSTGRES_USER' | 'POSTGRES_PASSWORD'
>;
export type RedisEnv = Pick<Env, 'REDIS_HOST' | 'REDIS_PORT' | 'REDIS_DB' | 'REDIS_PASSWORD'>;
export type RabbitMqEnv = Pick<
    Env,
    'RABBITMQ_HOST' | 'RABBITMQ_PORT' | 'RABBITMQ_USER' | 'RABBITMQ_PASSWORD' | 'RABBITMQ_VHOST'
>;
export type JwtEnv = Pick<
    Env,
    | 'JWT_ACCESS_SECRET'
    | 'JWT_REFRESH_SECRET'
    | 'JWT_ACCESS_TTL_SECONDS'
    | 'JWT_REFRESH_TTL_SECONDS'
    | 'JWT_ISSUER'
    | 'JWT_AUDIENCE'
    | 'JWT_ACTIVE_KID'
>;

@Injectable()
export class AppConfigService {
    constructor(private readonly configService: ConfigService) {}

    getPort(defaultPort?: number): number {
        return this.configService.get<number>('PORT') ?? defaultPort ?? 3000;
    }

    getNodeEnv(): Env['NODE_ENV'] {
        return this.configService.getOrThrow<Env['NODE_ENV']>('NODE_ENV');
    }

    getAuthGrpcHost(): string {
        return this.configService.get<string>('AUTH_GRPC_HOST') ?? '0.0.0.0';
    }

    getAuthGrpcPort(): number {
        return this.configService.get<number>('AUTH_GRPC_PORT') ?? 50051;
    }

    getAuthGrpcEndpoint(): { host: string; port: number } {
        return {
            host: this.getAuthGrpcHost(),
            port: this.getAuthGrpcPort(),
        };
    }

    getAuthGrpcUrl(): string {
        const endpoint = this.getAuthGrpcEndpoint();
        return `${endpoint.host}:${endpoint.port}`;
    }

    getDatabaseConfig(): DatabaseEnv {
        return {
            POSTGRES_HOST: this.configService.getOrThrow<string>('POSTGRES_HOST'),
            POSTGRES_PORT: this.configService.getOrThrow<number>('POSTGRES_PORT'),
            POSTGRES_DB: this.configService.getOrThrow<string>('POSTGRES_DB'),
            POSTGRES_USER: this.configService.getOrThrow<string>('POSTGRES_USER'),
            POSTGRES_PASSWORD: this.configService.getOrThrow<string>('POSTGRES_PASSWORD'),
        };
    }

    getRedisConfig(): RedisEnv {
        return {
            REDIS_HOST: this.configService.getOrThrow<string>('REDIS_HOST'),
            REDIS_PORT: this.configService.getOrThrow<number>('REDIS_PORT'),
            REDIS_DB: this.configService.getOrThrow<number>('REDIS_DB'),
            REDIS_PASSWORD: this.configService.get<string>('REDIS_PASSWORD'),
        };
    }

    getRabbitMqConfig(): RabbitMqEnv {
        return {
            RABBITMQ_HOST: this.configService.getOrThrow<string>('RABBITMQ_HOST'),
            RABBITMQ_PORT: this.configService.getOrThrow<number>('RABBITMQ_PORT'),
            RABBITMQ_USER: this.configService.getOrThrow<string>('RABBITMQ_USER'),
            RABBITMQ_PASSWORD: this.configService.getOrThrow<string>('RABBITMQ_PASSWORD'),
            RABBITMQ_VHOST: this.configService.getOrThrow<string>('RABBITMQ_VHOST'),
        };
    }

    getRabbitMqUrl(): string {
        const rabbitMqConfig = this.getRabbitMqConfig();
        const vhost = rabbitMqConfig.RABBITMQ_VHOST.startsWith('/')
            ? rabbitMqConfig.RABBITMQ_VHOST.slice(1)
            : rabbitMqConfig.RABBITMQ_VHOST;
        const encodedVhost = encodeURIComponent(vhost);

        return `amqp://${encodeURIComponent(rabbitMqConfig.RABBITMQ_USER)}:${encodeURIComponent(rabbitMqConfig.RABBITMQ_PASSWORD)}@${rabbitMqConfig.RABBITMQ_HOST}:${rabbitMqConfig.RABBITMQ_PORT}/${encodedVhost}`;
    }

    getJwtConfig(): JwtEnv {
        return {
            JWT_ACCESS_SECRET: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            JWT_REFRESH_SECRET: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            JWT_ACCESS_TTL_SECONDS: this.configService.getOrThrow<number>('JWT_ACCESS_TTL_SECONDS'),
            JWT_REFRESH_TTL_SECONDS: this.configService.getOrThrow<number>('JWT_REFRESH_TTL_SECONDS'),
            JWT_ISSUER: this.configService.getOrThrow<string>('JWT_ISSUER'),
            JWT_AUDIENCE: this.configService.getOrThrow<string>('JWT_AUDIENCE'),
            JWT_ACTIVE_KID: this.configService.getOrThrow<string>('JWT_ACTIVE_KID'),
        };
    }
}
