import { CheckPolicy, P, PermissionGuard, PolicyGuard, RequirePermission } from '@nam088/permission';
import { Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extended Request interface to include resource metadata injected by PolicyGuard.
 */
interface PolicyRequest extends Request {
    resources: Record<string, unknown>;
}

@Controller('abac-demo/users')
@UseGuards(PermissionGuard, PolicyGuard)
export class AbacDemoController {
    // Example 1: Explicitly declare @CheckPolicy
    @RequirePermission(P.user.update)
    @CheckPolicy('User') // Explicit declaration required (no auto-inference)
    @Put(':id')
    updateUser(@Param('id') id: string, @Req() req: PolicyRequest) {
        const targetUser = req.resources['User'];
        return {
            message: 'User updated successfully! (Explicit Policy)',
            targetUser,
        };
    }

    // Example 2: Custom idField
    @RequirePermission(P.user.read)
    @CheckPolicy('User', { idField: 'id' })
    @Get(':id')
    getUser(@Param('id') id: string, @Req() req: PolicyRequest) {
        return {
            message: 'User read successfully!',
            targetUser: req.resources['User'],
        };
    }

    // Example 3: Using a specific Rule
    @RequirePermission(P.user.update)
    @CheckPolicy('User', { rule: 'IsOwner' })
    @Put('me/:id')
    updateMe(@Param('id') id: string, @Req() req: PolicyRequest) {
        return {
            message: 'Owner updated successfully!',
            targetUser: req.resources['User'],
        };
    }
}
