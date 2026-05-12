import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PolicyGuard } from './policy.guard';
import { PolicyRegistry } from './policy.registry';

describe('PolicyGuard', () => {
    let guard: PolicyGuard;
    let reflector: Reflector;
    let registry: PolicyRegistry;

    const mockPolicy = {
        fetch: vi.fn(),
        authorize: vi.fn(),
    };

    const mockExecutionContext = (request: any = {}) =>
        ({
            switchToHttp: () => ({
                getRequest: () => request,
            }),
            getHandler: () => ({}),
            getClass: () => ({}),
        }) as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PolicyGuard,
                {
                    provide: Reflector,
                    useValue: {
                        getAllAndOverride: vi.fn(),
                    },
                },
                {
                    provide: PolicyRegistry,
                    useValue: {
                        get: vi.fn(),
                    },
                },
            ],
        }).compile();

        guard = module.get<PolicyGuard>(PolicyGuard);
        reflector = module.get<Reflector>(Reflector);
        registry = module.get<PolicyRegistry>(PolicyRegistry);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow when no @CheckPolicy metadata is found', async () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
        const context = mockExecutionContext();

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should throw Error if policy is not registered for resource', async () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ resource: 'User', action: 'Update' });
        vi.spyOn(registry, 'get').mockReturnValue(undefined as any);
        const context = mockExecutionContext();

        await expect(guard.canActivate(context)).rejects.toThrow('No Policy registered for resource: User');
    });

    it('should throw ForbiddenException if ID is missing from source', async () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
            resource: 'User',
            action: 'Update',
            source: 'params',
            idField: 'id',
        });
        vi.spyOn(registry, 'get').mockReturnValue(mockPolicy as any);
        const context = mockExecutionContext({ params: {} }); // Missing ID

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if resource is not found', async () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ resource: 'User', action: 'Update' });
        vi.spyOn(registry, 'get').mockReturnValue(mockPolicy as any);
        mockPolicy.fetch.mockResolvedValue(null);
        const context = mockExecutionContext({ params: { id: '123' } });

        await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is missing from request', async () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ resource: 'User', action: 'Update' });
        vi.spyOn(registry, 'get').mockReturnValue(mockPolicy as any);
        mockPolicy.fetch.mockResolvedValue({ id: '123' });
        const context = mockExecutionContext({ params: { id: '123' }, user: undefined });

        await expect(guard.canActivate(context)).rejects.toThrow('User context is required for Policy checks');
    });

    it('should throw ForbiddenException if policy.authorize returns false', async () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ resource: 'User', action: 'Update' });
        vi.spyOn(registry, 'get').mockReturnValue(mockPolicy as any);
        mockPolicy.fetch.mockResolvedValue({ id: '123' });
        mockPolicy.authorize.mockResolvedValue(false);
        const context = mockExecutionContext({ params: { id: '123' }, user: { sub: '456' } });

        await expect(guard.canActivate(context)).rejects.toThrow('Access denied by User policy: Update');
    });

    it('should allow and store resource in request when authorized', async () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ resource: 'User', action: 'Update' });
        vi.spyOn(registry, 'get').mockReturnValue(mockPolicy as any);
        const resource = { id: '123' };
        mockPolicy.fetch.mockResolvedValue(resource);
        mockPolicy.authorize.mockResolvedValue(true);
        const request: any = { params: { id: '123' }, user: { sub: '456' } };
        const context = mockExecutionContext(request);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(request.resources['User']).toBe(resource);
        expect(mockPolicy.authorize).toHaveBeenCalledWith(request.user, resource, 'Update');
    });
});
