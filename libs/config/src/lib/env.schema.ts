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
    AUTH_GRPC_HOST: z.string().min(1).default('0.0.0.0'),
    AUTH_GRPC_PORT: z.coerce.number().int().positive().default(50051),
});

export type Env = z.infer<typeof envSchema>;
