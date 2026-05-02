import { auth } from '@nam088/grpc';
import { shared } from '@nam088/utils';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetAuthStatusQuery } from './get-auth-status.query';

@QueryHandler(GetAuthStatusQuery)
export class GetAuthStatusQueryHandler implements IQueryHandler<GetAuthStatusQuery, auth.v1.GetStatusResponse> {
    async execute(): Promise<auth.v1.GetStatusResponse> {
        return { message: `Hello AUTH (${shared()})` };
    }
}
