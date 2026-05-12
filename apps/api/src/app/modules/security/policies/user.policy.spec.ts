import { getRepositoryToken } from '@mikro-orm/nestjs';
import { UserEntity } from '@nam088/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserPolicy } from './user.policy';

describe('UserPolicy', () => {
    let policy: UserPolicy;
    const mockUserRepository = {
        findOne: vi.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserPolicy,
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: mockUserRepository,
                },
            ],
        }).compile();

        policy = module.get<UserPolicy>(UserPolicy);
    });

    it('should be defined', () => {
        expect(policy).toBeDefined();
    });

    describe('fetch', () => {
        it('should fetch user from repository', async () => {
            const user = { id: '123', email: 'test@example.com' };
            mockUserRepository.findOne.mockResolvedValue(user);

            const result = await policy.fetch('123');

            expect(result).toEqual(user);
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: '123' });
        });
    });

    describe('checkOwner', () => {
        it('should return true if user ID matches resource ID', () => {
            const user = { sub: '123' };
            const resource = { id: '123' } as UserEntity;

            const result = policy.checkOwner(user as any, resource);

            expect(result).toBe(true);
        });

        it('should return false if user ID does not match resource ID', () => {
            const user = { sub: '123' };
            const resource = { id: '456' } as UserEntity;

            const result = policy.checkOwner(user as any, resource);

            expect(result).toBe(false);
        });
    });

    describe('canUpdate', () => {
        it('should allow if user has user:update permission', () => {
            const user = { sub: '123', permissions: ['user:update'] };
            const resource = { id: '456' } as UserEntity;

            const result = policy.canUpdate(user as any, resource);

            expect(result).toBe(true);
        });

        it('should allow if user is owner', () => {
            const user = { sub: '123', permissions: [] };
            const resource = { id: '123' } as UserEntity;

            const result = policy.canUpdate(user as any, resource);

            expect(result).toBe(true);
        });

        it('should deny if user has no permission and is not owner', () => {
            const user = { sub: '123', permissions: [] };
            const resource = { id: '456' } as UserEntity;

            const result = policy.canUpdate(user as any, resource);

            expect(result).toBe(false);
        });
    });
});
