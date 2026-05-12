import { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { PolicyRule } from './policy-rule.decorator';
import { ResourcePolicy } from './resource-policy.base';

// Concrete implementation for testing the abstract base class
class TestPolicy extends ResourcePolicy<{ id: string }> {
    readonly resourceType = 'Test';

    async fetch(id: string, _context: ExecutionContext) {
        return id === 'exists' ? { id } : null;
    }

    @PolicyRule('Read')
    async canRead(user: any, _resource: { id: string }) {
        return user.id === 'allowed';
    }

    @PolicyRule('Update')
    canUpdate(_user: any, resource: { id: string }) {
        return resource.id === 'exists';
    }

    // Method without @PolicyRule
    noRule() {
        return true;
    }
}

describe('ResourcePolicy', () => {
    const policy = new TestPolicy();

    describe('authorize', () => {
        it('should return true if strategy exists and returns true', async () => {
            const user = { id: 'allowed', sub: 'u1' };
            const resource = { id: 'exists' };

            const result = await policy.authorize(user as any, resource, 'Read');
            expect(result).toBe(true);
        });

        it('should return false if strategy exists and returns false', async () => {
            const user = { id: 'denied', sub: 'u1' };
            const resource = { id: 'exists' };

            const result = await policy.authorize(user as any, resource, 'Read');
            expect(result).toBe(false);
        });

        it('should return false if no strategy is found for the action', async () => {
            const user = { id: 'allowed', sub: 'u1' };
            const resource = { id: 'exists' };

            const result = await policy.authorize(user as any, resource, 'Delete');
            expect(result).toBe(false);
        });

        it('should ignore methods without @PolicyRule decorator', async () => {
            const user = { id: 'allowed', sub: 'u1' };
            const resource = { id: 'exists' };

            const result = await policy.authorize(user as any, resource, 'noRule');
            expect(result).toBe(false);
        });

        it('should work with synchronous strategy methods', async () => {
            const user = { id: 'any', sub: 'u1' };
            const resource = { id: 'exists' };

            const result = await policy.authorize(user as any, resource, 'Update');
            expect(result).toBe(true);
        });
    });
});
