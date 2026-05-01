import { auth, AUTH_GRPC_CLIENT_TOKEN, AUTH_GRPC_SERVICE_NAME } from '@nam088/grpc';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService implements OnModuleInit {
    private authGrpcService!: auth.v1.AuthServiceClient;

    constructor(@Inject(AUTH_GRPC_CLIENT_TOKEN) private readonly authClient: ClientGrpc) {}

    onModuleInit(): void {
        this.authGrpcService = this.authClient.getService<auth.v1.AuthServiceClient>(AUTH_GRPC_SERVICE_NAME);
    }

    async getData(): Promise<auth.v1.GetStatusResponse> {
        return firstValueFrom(this.authGrpcService.getStatus({}));
    }

    async pingAuth(name: string): Promise<auth.v1.PingResponse> {
        return firstValueFrom(this.authGrpcService.ping({ name }));
    }
}
