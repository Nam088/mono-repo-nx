import { ModuleRef } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PolicyRegistry } from './policy.registry';
import { ResourcePolicy } from './resource-policy.base';

class MockPolicy extends ResourcePolicy<any> {
    readonly resourceType = 'Mock';
    async fetch() {
        return null;
    }
}

class AnotherPolicy extends ResourcePolicy<any> {
    readonly resourceType = 'Another';
    async fetch() {
        return null;
    }
}

describe('PolicyRegistry', () => {
    let registry: PolicyRegistry;
    let moduleRef: ModuleRef;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PolicyRegistry,
                {
                    provide: ModuleRef,
                    useValue: {
                        create: vi.fn((type) => new type()),
                    },
                },
            ],
        }).compile();

        registry = module.get<PolicyRegistry>(PolicyRegistry);
        moduleRef = module.get<ModuleRef>(ModuleRef);
    });

    it('should register and retrieve a policy', async () => {
        await registry.register(MockPolicy);

        const policy = registry.get('Mock');
        expect(policy).toBeInstanceOf(MockPolicy);
        expect(moduleRef.create).toHaveBeenCalledWith(MockPolicy);
    });

    it('should return undefined if policy is not registered', () => {
        expect(registry.get('NonExistent')).toBeUndefined();
    });

    it('should return all registered policies', async () => {
        await registry.register(MockPolicy);
        await registry.register(AnotherPolicy);

        const all = registry.all();
        expect(all.some((p) => p instanceof MockPolicy)).toBe(true);
        expect(all.some((p) => p instanceof AnotherPolicy)).toBe(true);
        expect(all.length).toBe(2);
    });
});
