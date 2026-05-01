import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export interface ResponseMetaDto {
    timestamp?: string;
    traceId?: string;
    [key: string]: unknown;
}

export interface ResponseErrorDto {
    code: string;
    message: string;
    details?: unknown;
}

export interface StandardResponseDto<TData = unknown> {
    success: boolean;
    message: string;
    data?: TData;
    error?: ResponseErrorDto;
    meta?: ResponseMetaDto;
}

export interface PaginationMetaDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginatedDataDto<TItem> {
    items: TItem[];
    pagination: PaginationMetaDto;
}

export interface SuccessResponsePayload<TData> {
    data: TData;
    message?: string;
    meta?: ResponseMetaDto;
}

export interface ErrorResponsePayload {
    error: ResponseErrorDto;
    message?: string;
    meta?: ResponseMetaDto;
}

export interface PaginatedResponsePayload<TItem> {
    items: TItem[];
    page: number;
    limit: number;
    total: number;
    message?: string;
    meta?: ResponseMetaDto;
}

export class ResponseErrorClassDto implements ResponseErrorDto {
    @Expose()
    @ApiProperty({ example: 'VALIDATION_ERROR' })
    code!: string;

    @Expose()
    @ApiProperty({ example: 'Invalid payload' })
    message!: string;

    @Expose()
    @ApiPropertyOptional({ example: { field: 'email' } })
    details?: unknown;
}

export class ResponseMetaClassDto {
    @Expose()
    @ApiPropertyOptional({ example: '2026-05-01T11:22:33.000Z' })
    timestamp?: string;

    @Expose()
    @ApiPropertyOptional({ example: 'abc-123' })
    traceId?: string;
}

export class PaginationMetaClassDto implements PaginationMetaDto {
    @Expose()
    @ApiProperty({ example: 1 })
    page!: number;

    @Expose()
    @ApiProperty({ example: 10 })
    limit!: number;

    @Expose()
    @ApiProperty({ example: 100 })
    total!: number;

    @Expose()
    @ApiProperty({ example: 10 })
    totalPages!: number;

    @Expose()
    @ApiProperty({ example: true })
    hasNextPage!: boolean;

    @Expose()
    @ApiProperty({ example: false })
    hasPreviousPage!: boolean;
}

export class PaginatedDataClassDto<TItem> implements PaginatedDataDto<TItem> {
    @Expose()
    @ApiProperty({ example: [] })
    items!: TItem[];

    @Expose()
    @ApiProperty({ type: () => PaginationMetaClassDto })
    @Type(() => PaginationMetaClassDto)
    pagination!: PaginationMetaClassDto;
}

export class BaseResponseDto<TData = unknown> implements StandardResponseDto<TData> {
    @Expose()
    @ApiProperty({ example: true })
    success!: boolean;

    @Expose()
    @ApiProperty({ example: 'OK' })
    message!: string;

    @Expose()
    @ApiPropertyOptional({ description: 'Response payload' })
    data?: TData;

    @Expose()
    @ApiPropertyOptional({ type: () => ResponseErrorClassDto })
    @Type(() => ResponseErrorClassDto)
    error?: ResponseErrorClassDto;

    @Expose()
    @ApiPropertyOptional({ type: () => ResponseMetaClassDto })
    @Type(() => ResponseMetaClassDto)
    meta?: ResponseMetaDto;

    constructor(payload: StandardResponseDto<TData>) {
        this.success = payload.success;
        this.message = payload.message;
        this.data = payload.data;
        this.error = payload.error;
        this.meta = payload.meta;
    }
}

export class SuccessResponseDto<TData> extends BaseResponseDto<TData> {
    constructor(payload?: SuccessResponsePayload<TData>) {
        const { data, message = 'OK', meta } = payload ?? {};
        super({ success: true, message, data, meta });
    }
}

export class ErrorResponseDto extends BaseResponseDto<never> {
    constructor(payload?: ErrorResponsePayload) {
        const { error, message = 'Error', meta } = payload ?? {};
        super({ success: false, message, error, meta });
    }
}

export class PaginatedResponseDto<TItem> extends SuccessResponseDto<PaginatedDataDto<TItem>> {
    constructor(payload?: PaginatedResponsePayload<TItem>) {
        const { items = [], page = 1, limit = 10, total = 0, message = 'OK', meta } = payload ?? {};
        const totalPages = Math.ceil(total / Math.max(limit, 1));

        super({
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            },
            message,
            meta,
        });
    }
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMetaDto {
    const safeLimit = Math.max(limit, 1);
    const totalPages = Math.ceil(total / safeLimit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}

export function successResponse<TData>(
    data: TData,
    message = 'OK',
    meta?: ResponseMetaDto,
): StandardResponseDto<TData> {
    return new SuccessResponseDto({ data, message, meta });
}

export function errorResponse(
    error: ResponseErrorDto,
    message = 'Error',
    meta?: ResponseMetaDto,
): StandardResponseDto<never> {
    return new ErrorResponseDto({ error, message, meta });
}

export function paginatedResponse<TItem>(
    items: TItem[],
    page: number,
    limit: number,
    total: number,
    message = 'OK',
    meta?: ResponseMetaDto,
): StandardResponseDto<PaginatedDataDto<TItem>> {
    return new PaginatedResponseDto({ items, page, limit, total, message, meta });
}
