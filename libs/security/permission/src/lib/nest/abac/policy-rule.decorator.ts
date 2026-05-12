import { SetMetadata } from '@nestjs/common';

export const POLICY_RULE_METHOD_KEY = Symbol('@nam088/permission:policy-rule-method');

/**
 * Decorator to mark a method in a Policy class as a rule handler.
 * @param name The rule name (e.g., 'update', 'IsOwner')
 */
export const PolicyRule = (name: string) => SetMetadata(POLICY_RULE_METHOD_KEY, name);
