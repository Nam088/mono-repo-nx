import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from './env.schema';

export type DatabaseEnv = Pick<
    Env,
    'POSTGRES_HOST' | 'POSTGRES_PORT' | 'POSTGRES_DB' | 'POSTGRES_USER' | 'POSTGRES_PASSWORD'
>;
export type RedisEnv = Pick<Env, 'REDIS_HOST' | 'REDIS_PORT' | 'REDIS_DB' | 'REDIS_PASSWORD'>;

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
}
