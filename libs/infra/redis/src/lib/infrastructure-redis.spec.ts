import { REDIS_CLIENT } from './redis.constants';

describe('redis constants', () => {
    it('should expose REDIS_CLIENT token', () => {
        expect(typeof REDIS_CLIENT).toEqual('symbol');
    });
});
