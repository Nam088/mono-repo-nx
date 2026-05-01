import { buildDatabaseConfig } from './database.config';

describe('postgres database config', () => {
    it('should export buildDatabaseConfig', () => {
        expect(typeof buildDatabaseConfig).toEqual('function');
    });
});
