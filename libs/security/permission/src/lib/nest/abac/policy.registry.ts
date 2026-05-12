import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { ResourcePolicy } from './resource-policy.base';

@Injectable()
export class PolicyRegistry {
    private readonly policies = new Map<string, ResourcePolicy>();

    constructor(private readonly moduleRef: ModuleRef) {}

    /** Register a policy into the registry */
    async register(policyClass: Type<ResourcePolicy>) {
        const instance = await this.moduleRef.create(policyClass);
        console.log(`[PolicyRegistry] Registering policy for resource: ${instance.resourceType}`);
        this.policies.set(instance.resourceType, instance);
    }

    /** Get a policy instance by resource name */
    get(resourceType: string): ResourcePolicy | undefined {
        return this.policies.get(resourceType);
    }
}
