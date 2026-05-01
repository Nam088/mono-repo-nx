import { buildGrpcUrl } from './grpc';

describe('grpc runtime helpers', () => {
    it('should work', () => {
        expect(buildGrpcUrl({ host: '127.0.0.1', port: 50051 })).toEqual('127.0.0.1:50051');
    });
});
