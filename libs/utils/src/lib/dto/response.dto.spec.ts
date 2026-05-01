import { instanceToPlain, plainToInstance } from 'class-transformer';
import { describe, expect, it } from 'vitest';

import {
    errorResponse,
    ErrorResponseDto,
    paginatedResponse,
    PaginatedResponseDto,
    successResponse,
    SuccessResponseDto,
} from './response.dto.js';

describe('response dto helpers', () => {
    it('creates standard success response', () => {
        const result = successResponse({ id: 1 }, 'Fetched', { traceId: 'abc' });
        expect(result).toBeInstanceOf(SuccessResponseDto);

        expect(result).toEqual({
            success: true,
            message: 'Fetched',
            data: { id: 1 },
            meta: { traceId: 'abc' },
        });
    });

    it('creates standard error response', () => {
        const result = errorResponse({ code: 'VALIDATION_ERROR', message: 'Invalid payload' }, 'Request failed', {
            traceId: 'abc',
        });
        expect(result).toBeInstanceOf(ErrorResponseDto);

        expect(result).toEqual({
            success: false,
            message: 'Request failed',
            error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' },
            meta: { traceId: 'abc' },
        });
    });

    it('creates paginated response', () => {
        const result = paginatedResponse([{ id: 1 }, { id: 2 }], 2, 2, 5, 'Fetched list', { traceId: 'abc' });
        expect(result).toBeInstanceOf(PaginatedResponseDto);

        expect(result).toEqual({
            success: true,
            message: 'Fetched list',
            data: {
                items: [{ id: 1 }, { id: 2 }],
                pagination: {
                    page: 2,
                    limit: 2,
                    total: 5,
                    totalPages: 3,
                    hasNextPage: true,
                    hasPreviousPage: true,
                },
            },
            meta: { traceId: 'abc' },
        });
    });

    it('transforms plain object into class instance', () => {
        const instance = plainToInstance(SuccessResponseDto, {
            success: true,
            message: 'From plain',
            data: { id: 10 },
        }) as SuccessResponseDto<{ id: number }>;

        expect(instance).toBeInstanceOf(SuccessResponseDto);
        expect(instance.message).toBe('From plain');
        expect(instance.data).toEqual({ id: 10 });
    });

    it('serializes class response to plain object', () => {
        const response = new ErrorResponseDto({
            error: { code: 'BAD_REQUEST', message: 'Invalid' },
            message: 'Request failed',
        });
        const plain = instanceToPlain(response);

        expect(plain).toEqual({
            success: false,
            message: 'Request failed',
            error: { code: 'BAD_REQUEST', message: 'Invalid' },
        });
    });

    it('supports object payload constructor for paginated response', () => {
        const result = new PaginatedResponseDto({
            items: [{ id: 1 }],
            page: 1,
            limit: 10,
            total: 1,
            message: 'Listed',
            meta: { traceId: 'xyz' },
        });

        expect(result).toEqual({
            success: true,
            message: 'Listed',
            data: {
                items: [{ id: 1 }],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            },
            meta: { traceId: 'xyz' },
        });
    });
});
