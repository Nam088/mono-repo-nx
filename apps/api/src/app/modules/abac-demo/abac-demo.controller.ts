import { Check, P, PolicyGuard, RequirePermission } from '@nam088/permission';
import { Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

/**
 * Extended Request interface to include resource metadata injected by PolicyGuard.
 */
interface PolicyRequest extends Request {
    resources: Record<string, unknown>;
}

@Controller('abac-demo/users')
@UseGuards(JwtAccessGuard, PolicyGuard)
@ApiBearerAuth()
export class AbacDemoController {
    // Example 1: Explicitly declare @Check.User
    @RequirePermission(P.user.update)
    @Check.User('Update')
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
    @Check.User('Read')
    @Get(':id')
    getUser(@Param('id') id: string, @Req() req: PolicyRequest) {
        return {
            message: 'User read successfully!',
            targetUser: req.resources['User'],
        };
    }

    // Example 3: Using a specific Rule
    // @RequirePermission(P.user.update)
    @Check.User('IsOwner')
    @Put('me/:id')
    updateMe(@Param('id') id: string, @Req() req: PolicyRequest) {
        return {
            message: 'Owner updated successfully!',
            targetUser: req.resources['User'],
        };
    }
}
