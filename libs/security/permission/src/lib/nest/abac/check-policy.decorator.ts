import { applyDecorators, SetMetadata } from '@nestjs/common';

export const CHECK_POLICY_KEY = Symbol('@nam088/permission:check-policy');

/**
 * Global registry for Policies.
 * Augmented in application code.
 */
export interface AppPolicyMap {
    /** Internal use only to avoid empty interface lint error */
    readonly __brand: never;
}

export type ResourceKey = keyof AppPolicyMap extends '__brand' ? string : keyof AppPolicyMap;

export type ActionKey<K extends ResourceKey> = K extends keyof AppPolicyMap
    ? AppPolicyMap[K] extends never
        ? string
        : AppPolicyMap[K]
    : string;

export interface PolicySpec<K extends ResourceKey = ResourceKey> {
    resource: K;
    action: ActionKey<K>;
    source?: 'params' | 'body' | 'query';
    idField?: string;
}

/**
 * Base Decorator to check Policy for a Resource.
 */
export function CheckPolicy<K extends ResourceKey>(
    resource: K,
    action: ActionKey<K>,
    options: Omit<PolicySpec<K>, 'resource' | 'action'> = {},
): MethodDecorator & ClassDecorator {
    const spec: PolicySpec<K> = {
        resource,
        action,
        source: 'params',
        idField: 'id',
        ...options,
    };

    return applyDecorators(SetMetadata(CHECK_POLICY_KEY, spec));
}

/**
 * Smart Decorator Factory for better DX and autocomplete.
 */
export const Check = new Proxy({} as object, {
    get(_, resource: string) {
        return (action: string, options?: object) => CheckPolicy(resource as never, action as never, options as never);
    },
}) as {
    [K in ResourceKey]: (
        action: ActionKey<K>,
        options?: Omit<PolicySpec<K>, 'resource' | 'action'>,
    ) => MethodDecorator & ClassDecorator;
};
