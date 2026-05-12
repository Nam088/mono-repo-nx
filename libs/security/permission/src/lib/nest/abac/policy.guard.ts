import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSION_METADATA_KEY } from '../permission.constants';
import type { PermissionRequirement } from '../require-permission.decorator';
import { CHECK_POLICY_KEY, PolicySpec } from './check-policy.decorator';
import { PolicyRegistry } from './policy.registry';

@Injectable()
export class PolicyGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly registry: PolicyRegistry,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // 1. Get Policy check information
        const policySpec = this.reflector.getAllAndOverride<PolicySpec | undefined>(CHECK_POLICY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 2. Skip ABAC check if @CheckPolicy is not declared
        if (!policySpec) return true;

        // 3. Get Permission information (to determine the action)
        const requirement = this.reflector.getAllAndOverride<PermissionRequirement | undefined>(
            PERMISSION_METADATA_KEY,
            [context.getHandler(), context.getClass()],
        );

        // 4. Fetch Resource
        const policy = this.registry.get(policySpec.resource);
        if (!policy) {
            throw new Error(`No Policy registered for resource: ${policySpec.resource}`);
        }

        const id = request[policySpec.source || 'params']?.[policySpec.idField || 'id'];
        if (!id) {
            throw new ForbiddenException(`Missing required ID field: ${policySpec.source}.${policySpec.idField}`);
        }

        const resource = await policy.fetch(id, context);
        if (!resource) {
            throw new NotFoundException(`${policySpec.resource} not found with ID: ${id}`);
        }

        // Save into request for controller usage
        if (!request.resources) request.resources = {};
        request.resources[policySpec.resource] = resource;

        // 5. Authorize
        const user = request.user;
        const action = requirement?.keys[0]?.split(':')[1] || 'access';

        const isAllowed = await policy.authorize(user, resource, action, policySpec.rule);

        if (!isAllowed) {
            throw new ForbiddenException(`Access denied by ${policySpec.resource} policy`);
        }

        return true;
    }
}
