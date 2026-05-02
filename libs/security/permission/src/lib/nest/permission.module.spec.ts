import 'reflect-metadata';

import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { PERMISSIONS_RESOLVER } from './permission.constants';
import { PermissionGuard } from './permission.guard';
import { PermissionModule } from './permission.module';
import type { PermissionsResolver } from './permissions-resolver.interface';

class StaticResolver implements PermissionsResolver {
    resolve(): readonly string[] {
        return ['user:read'];
    }
}

describe('PermissionModule.forRoot', () => {
    it('binds a class-based resolver under PERMISSIONS_RESOLVER and exposes the guard', async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [PermissionModule.forRoot({ resolver: StaticResolver })],
        }).compile();

        const resolver = moduleRef.get<PermissionsResolver>(PERMISSIONS_RESOLVER);
        const guard = moduleRef.get(PermissionGuard);

        expect(resolver).toBeInstanceOf(StaticResolver);
        expect(guard).toBeInstanceOf(PermissionGuard);
        await moduleRef.close();
    });

    it('accepts a useValue resolver provider', async () => {
        const instance: PermissionsResolver = { resolve: () => [] };
        const moduleRef = await Test.createTestingModule({
            imports: [PermissionModule.forRoot({ resolver: { useValue: instance } })],
        }).compile();

        expect(moduleRef.get<PermissionsResolver>(PERMISSIONS_RESOLVER)).toBe(instance);
        await moduleRef.close();
    });

    it('accepts a useFactory resolver provider', async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                PermissionModule.forRoot({
                    resolver: {
                        useFactory: () => new StaticResolver(),
                    },
                }),
            ],
        }).compile();

        expect(moduleRef.get<PermissionsResolver>(PERMISSIONS_RESOLVER)).toBeInstanceOf(StaticResolver);
        await moduleRef.close();
    });
});
