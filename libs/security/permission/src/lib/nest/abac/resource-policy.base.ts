import { ExecutionContext } from '@nestjs/common';

import { POLICY_RULE_METHOD_KEY } from './policy-rule.decorator';

export type PolicyUser = { readonly sub: string; readonly permissions?: string[]; readonly [key: string]: unknown };

/**
 * Type definition for a Policy Strategy method.
 */
export type PolicyStrategy<T = unknown> = (user: PolicyUser, resource: T) => boolean | Promise<boolean>;

/**
 * Base class for all ABAC Policies.
 * Each Resource (User, Order, etc.) must implement this class.
 */
export abstract class ResourcePolicy<T = unknown> {
    /** Unique identifier for the resource (e.g., 'User', 'Order') */
    abstract readonly resourceType: string;

    /** Logic to fetch data from the database or cache */
    abstract fetch(id: string, context: ExecutionContext): Promise<T | null> | T | null;

    /**
     * Handles authorization by finding the appropriate strategy method marked with @PolicyRule.
     */
    async authorize(user: PolicyUser, resource: T, action: string): Promise<boolean> {
        const strategy = this.findStrategy(action);

        if (!strategy) {
            return false;
        }

        return await strategy(user, resource);
    }

    /**
     * Scans the class prototype for a method decorated with @PolicyRule(name).
     */
    private findStrategy(name: string): PolicyStrategy<T> | undefined {
        const prototype = Object.getPrototypeOf(this);
        const methodNames = Object.getOwnPropertyNames(prototype);

        // Find the first method that has the matching @PolicyRule metadata
        const targetMethodName = methodNames.find((methodName) => {
            const method = (this as Record<string, unknown>)[methodName];
            if (typeof method !== 'function' || methodName === 'constructor') {
                return false;
            }
            return Reflect.getMetadata(POLICY_RULE_METHOD_KEY, method) === name;
        });

        if (targetMethodName) {
            const method = (this as Record<string, unknown>)[targetMethodName];
            if (typeof method === 'function') {
                return method.bind(this) as PolicyStrategy<T>;
            }
        }

        return undefined;
    }
}
