import { applyDecorators, SetMetadata } from '@nestjs/common';

export const ABAC_RESOURCE_METADATA_KEY = Symbol('@nam088/permission:abac-resource');

export interface InjectResourceSpec {
    /** The type of resource to fetch (e.g., 'User', 'Article') */
    type: string;
    /** The route parameter key holding the ID (e.g., 'id') */
    idParam: string;
}

/**
 * Declares the resource being accessed in the current route handler.
 * Used by AbacGuard to fetch and inject the resource into the request.
 */
export function InjectResource(spec: InjectResourceSpec | InjectResourceSpec[]): MethodDecorator & ClassDecorator {
    return applyDecorators(SetMetadata(ABAC_RESOURCE_METADATA_KEY, Array.isArray(spec) ? spec : [spec]));
}
