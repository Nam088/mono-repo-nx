import { RABBITMQ_CHANNEL, RABBITMQ_CONNECTION } from './rabbitmq.constants';

describe('rabbitmq constants', () => {
    it('should expose rabbitmq tokens', () => {
        expect(typeof RABBITMQ_CONNECTION).toEqual('symbol');
        expect(typeof RABBITMQ_CHANNEL).toEqual('symbol');
    });
});
