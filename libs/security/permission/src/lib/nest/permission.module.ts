import { type DynamicModule, type FactoryProvider, Module, type Provider, type Type } from '@nestjs/common';

import { PERMISSIONS_RESOLVER } from './permission.constants';
import { PermissionGuard } from './permission.guard';
import type { PermissionsResolver } from './permissions-resolver.interface';

type ResolverFactoryProvider = {
    readonly useFactory: (...deps: readonly unknown[]) => PermissionsResolver | Promise<PermissionsResolver>;
    readonly inject?: FactoryProvider['inject'];
};

/**
 * Accepted shapes for registering a `PermissionsResolver` implementation:
 * a class to instantiate, or one of the standard Nest provider configs.
 */
export type PermissionsResolverConfig =
    | Type<PermissionsResolver>
    | { readonly useClass: Type<PermissionsResolver> }
    | { readonly useExisting: Type<PermissionsResolver> }
    | { readonly useValue: PermissionsResolver }
    | ResolverFactoryProvider;

export interface PermissionModuleOptions {
    /** Resolver registration. */
    readonly resolver: PermissionsResolverConfig;
    /** Modules required to satisfy the resolver's dependencies. */
    readonly imports?: DynamicModule['imports'];
    /** Extra providers to instantiate alongside the resolver (e.g. config tokens). */
    readonly providers?: readonly Provider[];
}

@Module({})
export class PermissionModule {
    static forRoot(options: PermissionModuleOptions): DynamicModule {
        const resolverProvider = buildResolverProvider(options.resolver);
        return {
            module: PermissionModule,
            imports: options.imports ?? [],
            providers: [...(options.providers ?? []), resolverProvider, PermissionGuard],
            exports: [PermissionGuard, PERMISSIONS_RESOLVER],
        };
    }
}

function buildResolverProvider(config: PermissionsResolverConfig): Provider {
    if (typeof config === 'function') {
        return { provide: PERMISSIONS_RESOLVER, useClass: config };
    }
    if ('useClass' in config) {
        return { provide: PERMISSIONS_RESOLVER, useClass: config.useClass };
    }
    if ('useExisting' in config) {
        return { provide: PERMISSIONS_RESOLVER, useExisting: config.useExisting };
    }
    if ('useValue' in config) {
        return { provide: PERMISSIONS_RESOLVER, useValue: config.useValue };
    }
    return {
        provide: PERMISSIONS_RESOLVER,
        useFactory: config.useFactory as (...args: unknown[]) => PermissionsResolver | Promise<PermissionsResolver>,
        inject: config.inject,
    };
}
