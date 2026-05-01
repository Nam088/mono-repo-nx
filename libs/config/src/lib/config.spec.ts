import { parseEnv, validateEnv } from './config';

describe('config', () => {
    it('returns defaults when env values are missing', () => {
        expect(validateEnv({})).toMatchObject({
            NODE_ENV: 'development',
            PORT: 3000,
            POSTGRES_HOST: '127.0.0.1',
            POSTGRES_PORT: 5433,
            POSTGRES_DB: 'app_db',
            POSTGRES_USER: 'postgres',
            POSTGRES_PASSWORD: 'postgres',
        });
    });

    it('coerces numeric values', () => {
        expect(parseEnv({ POSTGRES_PORT: '5432', PORT: '4000' })).toMatchObject({
            POSTGRES_PORT: 5432,
            PORT: 4000,
        });
    });

    it('throws on invalid enum values', () => {
        expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow(/Invalid environment variables/);
    });
});
