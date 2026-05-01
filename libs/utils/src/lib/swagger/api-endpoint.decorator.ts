import type { Type } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBasicAuth,
    ApiBearerAuth,
    ApiExtraModels,
    ApiOAuth2,
    ApiOperation,
    ApiResponse,
    ApiSecurity,
    getSchemaPath,
} from '@nestjs/swagger';

import { PaginationMetaClassDto, ResponseErrorClassDto, ResponseMetaClassDto } from '../dto/response.dto';

type SwaggerSchema = Record<string, unknown>;
type SwaggerExampleMap = Record<string, { summary: string; value: Record<string, unknown> }>;

export interface NamedModelOption {
    name: string;
    model: Type<unknown>;
}

export interface DiscriminatorOption {
    propertyName: string;
    mapping?: Record<string, string>;
}

export interface SuccessPayloadOption {
    schema?: SwaggerSchema;
    models?: Array<Type<unknown> | NamedModelOption>;
    paginated?: boolean;
    discriminator?: DiscriminatorOption;
}

export interface ApiEndpointSuccessOption {
    status?: number;
    description?: string;
    payload?: SuccessPayloadOption;
    envelope?: boolean;
    messageExample?: string;
    metaSchema?: SwaggerSchema;
    examples?: SwaggerExampleMap;
    autoExamples?: boolean;
    autoExampleData?: Record<string, Record<string, unknown>>;
}

export interface ApiEndpointErrorOption {
    status: number;
    description?: string;
    schema?: SwaggerSchema;
    examples?: SwaggerExampleMap;
}

type ApiEndpointAuthType = 'bearer' | 'basic' | 'oauth2' | 'apiKey' | 'custom';

export interface ApiEndpointAuthOption {
    type: ApiEndpointAuthType;
    schemeName?: string;
    scopes?: string[];
}

export interface ApiEndpointOptions {
    summary: string;
    description?: string;
    success: ApiEndpointSuccessOption[];
    errors?: ApiEndpointErrorOption[];
    auth?: ApiEndpointAuthOption[];
    defaultErrors?: false | ApiEndpointErrorOption[];
}

export interface ApiEndpointResponseDoc {
    status: number;
    description?: string;
    schema: SwaggerSchema;
    examples?: SwaggerExampleMap;
}

interface ApiEndpointSecurityDoc {
    type: ApiEndpointAuthType;
    schemeName: string;
    scopes: string[];
}

const API_MODEL_PROPERTIES = 'swagger/apiModelProperties';
const API_MODEL_PROPERTIES_ARRAY = 'swagger/apiModelPropertiesArray';
const DEFAULT_SUCCESS_STATUS = 200;
const DEFAULT_SUCCESS_MESSAGE = 'OK';
const DEFAULT_BEARER_SCHEME = 'bearer';
const DEFAULT_BASIC_SCHEME = 'basic';
const DEFAULT_OAUTH2_SCHEME = 'oauth2';
const DEFAULT_API_KEY_SCHEME = 'apiKey';
const DEFAULT_CUSTOM_SCHEME = 'customAuth';
const BASE_DEFAULT_ERRORS: ApiEndpointErrorOption[] = [
    { status: 400, description: 'Bad request' },
    { status: 500, description: 'Internal server error' },
];
const AUTH_DEFAULT_ERRORS: ApiEndpointErrorOption[] = [
    { status: 401, description: 'Unauthorized' },
    { status: 403, description: 'Forbidden' },
];
const ROOT_REQUIRED_FIELDS = ['success', 'message'] as const;
const PAGINATION_REQUIRED_FIELDS = ['page', 'limit', 'total', 'totalPages', 'hasNextPage', 'hasPreviousPage'] as const;

function toExampleKey(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map((part, index) => (index === 0 ? part.toLowerCase() : part[0].toUpperCase() + part.slice(1)))
        .join('');
}

function modelExampleFromSwaggerMetadata(model: Type<unknown>): Record<string, unknown> | undefined {
    const modelPrototype = model.prototype as object;
    const metadataArray = Reflect.getMetadata(API_MODEL_PROPERTIES_ARRAY, modelPrototype) as string[] | undefined;

    if (!metadataArray || metadataArray.length === 0) {
        return undefined;
    }

    const result: Record<string, unknown> = {};

    for (const metadataKey of metadataArray) {
        const propertyKey = metadataKey.startsWith(':') ? metadataKey.slice(1) : metadataKey;
        const propertyMeta = Reflect.getMetadata(API_MODEL_PROPERTIES, modelPrototype, propertyKey) as
            | { example?: unknown }
            | undefined;

        if (!propertyMeta || propertyMeta.example === undefined) {
            continue;
        }

        result[propertyKey] = propertyMeta.example;
    }

    return Object.keys(result).length > 0 ? result : undefined;
}

function isNamedModelOption(model: Type<unknown> | NamedModelOption): model is NamedModelOption {
    return 'name' in model && 'model' in model;
}

function getPayloadModelDescriptors(payload?: SuccessPayloadOption): Array<{ name: string; model: Type<unknown> }> {
    if (!payload?.models) {
        return [];
    }

    return payload.models.map((modelOption) =>
        isNamedModelOption(modelOption) ? modelOption : { name: modelOption.name, model: modelOption },
    );
}

function buildModelSchema(payload?: SuccessPayloadOption): SwaggerSchema | undefined {
    if (!payload) {
        return undefined;
    }
    if (payload.schema) {
        return payload.schema;
    }

    const models = getPayloadModelDescriptors(payload);

    if (models.length === 0) {
        return undefined;
    }

    const refs = models.map((entry) => ({
        allOf: [{ $ref: getSchemaPath(entry.model) }],
        title: entry.name,
    }));

    if (refs.length === 1) {
        return refs[0];
    }

    return {
        oneOf: refs,
        ...(payload.discriminator ? { discriminator: payload.discriminator } : {}),
    };
}

function buildPayloadSchema(payload?: SuccessPayloadOption): SwaggerSchema | undefined {
    const baseSchema = buildModelSchema(payload);

    if (!baseSchema) {
        return undefined;
    }
    if (!payload?.paginated) {
        return baseSchema;
    }

    return {
        type: 'object',
        required: ['items', 'pagination'],
        properties: {
            items: {
                type: 'array',
                items: baseSchema,
            },
            pagination: {
                type: 'object',
                required: [...PAGINATION_REQUIRED_FIELDS],
                properties: {
                    page: { type: 'number', example: 1 },
                    limit: { type: 'number', example: 10 },
                    total: { type: 'number', example: 100 },
                    totalPages: { type: 'number', example: 10 },
                    hasNextPage: { type: 'boolean', example: true },
                    hasPreviousPage: { type: 'boolean', example: false },
                },
            },
        },
    };
}

function buildSuccessSchema(successOption: ApiEndpointSuccessOption): SwaggerSchema {
    const payloadSchema = buildPayloadSchema(successOption.payload);
    const useEnvelope = successOption.envelope ?? true;

    if (!useEnvelope) {
        return payloadSchema ?? { type: 'object', additionalProperties: true };
    }

    const requiredFields = payloadSchema ? [...ROOT_REQUIRED_FIELDS, 'data'] : [...ROOT_REQUIRED_FIELDS];
    return {
        type: 'object',
        required: requiredFields,
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: successOption.messageExample ?? DEFAULT_SUCCESS_MESSAGE },
            ...(payloadSchema ? { data: payloadSchema } : {}),
            meta: successOption.metaSchema ?? {
                type: 'object',
                nullable: true,
                additionalProperties: true,
                example: { traceId: 'abc-123' },
            },
        },
    };
}

function buildModelExampleMap(payload?: SuccessPayloadOption): Map<string, Record<string, unknown>> {
    const modelExampleMap = new Map<string, Record<string, unknown>>();

    for (const item of getPayloadModelDescriptors(payload)) {
        const example = modelExampleFromSwaggerMetadata(item.model);

        if (example) {
            modelExampleMap.set(item.name, example);
        }
    }

    return modelExampleMap;
}

function buildAutoExamples(successOption: ApiEndpointSuccessOption): SwaggerExampleMap | undefined {
    const descriptors = getPayloadModelDescriptors(successOption.payload);

    if (descriptors.length < 2) {
        return undefined;
    }

    const useEnvelope = successOption.envelope ?? true;
    const message = successOption.messageExample ?? DEFAULT_SUCCESS_MESSAGE;
    const exampleMap = buildModelExampleMap(successOption.payload);

    return Object.fromEntries(
        descriptors.map((descriptor) => {
            const key = toExampleKey(descriptor.name);
            const sampleData = successOption.autoExampleData?.[descriptor.name] ??
                successOption.autoExampleData?.[key] ??
                exampleMap.get(descriptor.name) ?? { _type: descriptor.name };

            return [
                key,
                {
                    summary: `${descriptor.name} response`,
                    value: useEnvelope
                        ? {
                              success: true,
                              message,
                              data: sampleData,
                              meta: { traceId: 'auto-example' },
                          }
                        : sampleData,
                },
            ];
        }),
    );
}

function resolveSuccessExamples(successOption: ApiEndpointSuccessOption): SwaggerExampleMap | undefined {
    return (
        successOption.examples ?? (successOption.autoExamples === false ? undefined : buildAutoExamples(successOption))
    );
}

function collectResponseModels(options: ApiEndpointOptions): Type<unknown>[] {
    const models = new Set<Type<unknown>>([ResponseMetaClassDto, ResponseErrorClassDto]);

    for (const success of options.success) {
        for (const descriptor of getPayloadModelDescriptors(success.payload)) {
            models.add(descriptor.model);
        }
        if (success.payload?.paginated) {
            models.add(PaginationMetaClassDto);
        }
    }

    return Array.from(models);
}

function createErrorSchema(errorOption: ApiEndpointErrorOption): SwaggerSchema {
    return (
        errorOption.schema ?? {
            type: 'object',
            required: ['success', 'message'],
            properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: errorOption.description ?? 'Request failed' },
                errorCode: { type: 'string', example: `HTTP_${errorOption.status}` },
            },
        }
    );
}

function resolveAuthSchemeName(auth: ApiEndpointAuthOption): string {
    if (auth.schemeName) {
        return auth.schemeName;
    }

    if (auth.type === 'bearer') {
        return DEFAULT_BEARER_SCHEME;
    }
    if (auth.type === 'basic') {
        return DEFAULT_BASIC_SCHEME;
    }
    if (auth.type === 'oauth2') {
        return DEFAULT_OAUTH2_SCHEME;
    }
    if (auth.type === 'apiKey') {
        return DEFAULT_API_KEY_SCHEME;
    }

    return DEFAULT_CUSTOM_SCHEME;
}

export function buildApiEndpointSecurityDocs(options: ApiEndpointOptions): ApiEndpointSecurityDoc[] {
    return (options.auth ?? []).map((authOption) => ({
        type: authOption.type,
        schemeName: resolveAuthSchemeName(authOption),
        scopes: authOption.scopes ?? [],
    }));
}

export function ApiEndpoint(options: ApiEndpointOptions): MethodDecorator {
    const { models, responses } = buildApiEndpointResponseDocs(options);
    const securityDocs = buildApiEndpointSecurityDocs(options);
    const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
        ApiOperation({ summary: options.summary, description: options.description }),
        ...securityDocs.map((securityDoc) => {
            if (securityDoc.type === 'bearer') {
                return ApiBearerAuth(securityDoc.schemeName);
            }
            if (securityDoc.type === 'basic') {
                return ApiBasicAuth(securityDoc.schemeName);
            }
            if (securityDoc.type === 'oauth2') {
                return ApiOAuth2(securityDoc.scopes, securityDoc.schemeName);
            }

            return ApiSecurity(securityDoc.schemeName, securityDoc.scopes);
        }),
        ...responses.map((response) =>
            ApiResponse({
                status: response.status,
                description: response.description,
                content: {
                    'application/json': {
                        schema: response.schema,
                        ...(response.examples && Object.keys(response.examples).length > 0
                            ? { examples: response.examples }
                            : {}),
                    },
                },
            }),
        ),
    ];

    if (models.length > 0) {
        decorators.unshift(ApiExtraModels(...models));
    }

    return applyDecorators(...decorators);
}

export function buildApiEndpointResponseDocs(options: ApiEndpointOptions): {
    models: Type<unknown>[];
    responses: ApiEndpointResponseDoc[];
} {
    if (options.success.length === 0) {
        throw new Error('ApiEndpoint requires at least one success response definition.');
    }

    const effectiveErrorOptions = resolveErrorOptions(options);
    const responses: ApiEndpointResponseDoc[] = [
        ...options.success.map((successOption) => ({
            status: successOption.status ?? DEFAULT_SUCCESS_STATUS,
            description: successOption.description,
            schema: buildSuccessSchema(successOption),
            examples: resolveSuccessExamples(successOption),
        })),
        ...effectiveErrorOptions.map((errorOption) => ({
            status: errorOption.status,
            description: errorOption.description,
            schema: createErrorSchema(errorOption),
            examples: errorOption.examples,
        })),
    ];

    return { models: collectResponseModels(options), responses };
}

function resolveErrorOptions(options: ApiEndpointOptions): ApiEndpointErrorOption[] {
    if (options.defaultErrors === false) {
        return options.errors ?? [];
    }

    const hasAuth = (options.auth ?? []).length > 0;
    const defaultErrors = options.defaultErrors ?? [...BASE_DEFAULT_ERRORS, ...(hasAuth ? AUTH_DEFAULT_ERRORS : [])];
    const explicitErrors = options.errors ?? [];
    const mergedErrors = [...defaultErrors, ...explicitErrors];
    const dedupedByStatus = new Map<number, ApiEndpointErrorOption>();

    for (const errorOption of mergedErrors) {
        dedupedByStatus.set(errorOption.status, errorOption);
    }

    return Array.from(dedupedByStatus.values());
}
