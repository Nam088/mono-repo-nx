import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';

type RequestContext = {
    traceId: string;
};

@Injectable()
export class RequestContextService {
    private readonly storage = new AsyncLocalStorage<RequestContext>();

    run<T>(context: RequestContext, callback: () => T): T {
        return this.storage.run(context, callback);
    }

    getTraceId(): string | undefined {
        return this.storage.getStore()?.traceId;
    }
}
