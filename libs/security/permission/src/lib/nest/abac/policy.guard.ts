import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CHECK_POLICY_KEY, type PolicySpec, type ResourceKey } from './check-policy.decorator';
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
        const policySpec = this.reflector.getAllAndOverride<PolicySpec<ResourceKey> | undefined>(CHECK_POLICY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 2. Skip ABAC check if @CheckPolicy is not declared
        if (!policySpec) return true;

        // 3. Fetch Resource
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

        // 4. Authorize using explicit action
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User context is required for Policy checks');
        }

        const isAllowed = await policy.authorize(user, resource, policySpec.action);

        if (!isAllowed) {
            throw new ForbiddenException(`Access denied by ${policySpec.resource} policy: ${policySpec.action}`);
        }

        return true;
    }
}
