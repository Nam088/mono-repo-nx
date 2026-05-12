import { applyDecorators, SetMetadata } from '@nestjs/common';

export const CHECK_POLICY_KEY = Symbol('@nam088/permission:check-policy');

export interface PolicySpec {
    /** Resource name (e.g., 'User') */
    resource: string;
    /** ID source (default: 'params') */
    source?: 'params' | 'body' | 'query';
    /** Field name containing the ID (default: 'id') */
    idField?: string;
    /** Specific check rule (falls back to default action if not provided) */
    rule?: string;
}

/**
 * Decorator to check Policy for a Resource.
 * Supports automatic fetching and ABAC logic evaluation.
 */
export function CheckPolicy(
    resource: string,
    options: Omit<PolicySpec, 'resource'> = {},
): MethodDecorator & ClassDecorator {
    const spec: PolicySpec = {
        resource,
        source: 'params',
        idField: 'id',
        ...options,
    };

    return applyDecorators(SetMetadata(CHECK_POLICY_KEY, spec));
}
