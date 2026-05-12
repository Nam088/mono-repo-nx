import { Injectable, Type } from '@nestjs/common';
import { DiscoveryService as NestDiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

export interface DiscoveredProvider<T = unknown> {
    instance: T;
    type: Type<T>;
    meta: unknown;
}

export interface DiscoveredMethod {
    handler: (...args: unknown[]) => unknown;
    methodName: string;
    parentClass: DiscoveredProvider;
    meta: unknown;
}

@Injectable()
export class DiscoveryService {
    constructor(
        private readonly nestDiscoveryService: NestDiscoveryService,
        private readonly metadataScanner: MetadataScanner,
        private readonly reflector: Reflector,
    ) {}

    /**
     * Finds all providers that have a specific metadata key.
     */
    providersWithMetaAtKey<T = unknown>(metaKey: string | symbol): DiscoveredProvider<T>[] {
        const providers = this.nestDiscoveryService.getProviders();

        return providers
            .filter((wrapper) => wrapper.isDependencyTreeStatic())
            .filter((wrapper) => wrapper.instance && wrapper.metatype)
            .map((wrapper) => {
                const meta = this.reflector.get(metaKey, wrapper.metatype as Type<unknown>);
                if (meta) {
                    return {
                        instance: wrapper.instance as T,
                        type: wrapper.metatype as Type<T>,
                        meta,
                    };
                }
                return null;
            })
            .filter((p): p is DiscoveredProvider<T> => !!p);
    }

    /**
     * Finds all methods in all providers that have a specific metadata key.
     */
    methodsWithMetaAtKey(metaKey: string | symbol): DiscoveredMethod[] {
        const providers = this.nestDiscoveryService.getProviders();
        const discoveredMethods: DiscoveredMethod[] = [];

        providers
            .filter((wrapper) => wrapper.isDependencyTreeStatic())
            .filter((wrapper) => wrapper.instance && wrapper.metatype)
            .forEach((wrapper) => {
                const instance = wrapper.instance;
                const prototype = Object.getPrototypeOf(instance);
                const methodNames = this.metadataScanner.getAllMethodNames(prototype);

                for (const methodName of methodNames) {
                    const handler = instance[methodName];
                    if (typeof handler !== 'function') continue;

                    const meta = this.reflector.get(metaKey, handler);
                    if (meta) {
                        discoveredMethods.push({
                            handler: handler.bind(instance),
                            methodName,
                            parentClass: {
                                instance: instance as unknown,
                                type: wrapper.metatype as Type<unknown>,
                                meta: this.reflector.get(metaKey, wrapper.metatype as Type<unknown>),
                            },
                            meta,
                        });
                    }
                }
            });

        return discoveredMethods;
    }
}
