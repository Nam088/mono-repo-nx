import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    POSTGRES_HOST: z.string().min(1).default('127.0.0.1'),
    POSTGRES_PORT: z.coerce.number().int().positive().default(5433),
    POSTGRES_DB: z.string().min(1).default('app_db'),
    POSTGRES_USER: z.string().min(1).default('postgres'),
    POSTGRES_PASSWORD: z.string().min(1).default('postgres'),
    REDIS_HOST: z.string().min(1).default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_DB: z.coerce.number().int().nonnegative().default(0),
    REDIS_PASSWORD: z.string().optional(),
    RABBITMQ_HOST: z.string().min(1).default('127.0.0.1'),
    RABBITMQ_PORT: z.coerce.number().int().positive().default(5672),
    RABBITMQ_USER: z.string().min(1).default('guest'),
    RABBITMQ_PASSWORD: z.string().min(1).default('guest'),
    RABBITMQ_VHOST: z.string().default('/'),
    AUTH_GRPC_HOST: z.string().min(1).default('0.0.0.0'),
    AUTH_GRPC_PORT: z.coerce.number().int().positive().default(50051),
    JWT_ACCESS_SECRET: z.string().min(16).default('change-me-access-secret'),
    JWT_REFRESH_SECRET: z.string().min(16).default('change-me-refresh-secret'),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    JWT_REFRESH_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(60 * 60 * 24 * 14),
    JWT_ISSUER: z.string().min(1).default('nam088-auth'),
    JWT_AUDIENCE: z.string().min(1).default('nam088-clients'),
    JWT_ACTIVE_KID: z.string().min(1).default('v1'),
});

export type Env = z.infer<typeof envSchema>;
