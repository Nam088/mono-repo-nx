import { ExecutionContext } from '@nestjs/common';

import { POLICY_RULE_METHOD_KEY } from './policy-rule.decorator';

export type PolicyUser = { readonly sub: string; readonly permissions?: string[]; readonly [key: string]: unknown };

/**
 * Type definition for a Policy Strategy method.
 * Ensures strict typing for parameters and return values.
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
     * Falls back to false if no strategy is found.
     */
    async authorize(user: PolicyUser, resource: T, action: string, rule?: string): Promise<boolean> {
        const strategyName = rule || action;
        const strategy = this.findStrategy(strategyName);

        if (strategy) {
            return await strategy.call(this, user, resource);
        }

        return false;
    }

    /**
     * Scans the class for a method decorated with @PolicyRule(name).
     */
    private findStrategy(name: string): PolicyStrategy<T> | undefined {
        const prototype = Object.getPrototypeOf(this);
        const methodNames = Object.getOwnPropertyNames(prototype);

        for (const methodName of methodNames) {
            const ruleName = Reflect.getMetadata(POLICY_RULE_METHOD_KEY, prototype, methodName);
            if (ruleName === name) {
                return (this as unknown as Record<string, PolicyStrategy<T>>)[methodName];
            }
        }

        return undefined;
    }
}
