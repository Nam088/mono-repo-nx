import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import type { PermissionKey, PolicyUser } from '@nam088/permission';
import { P, PERMISSIONS, PolicyRule, ResourcePolicy } from '@nam088/permission';
import { UserEntity } from '@nam088/postgresql';
import { Injectable, Logger } from '@nestjs/common';

declare module '@nam088/permission' {
    interface AppPolicyMap {
        User: 'Read' | 'Update' | 'IsOwner' | 'Delete';
    }
}

@Injectable()
export class UserPolicy extends ResourcePolicy<UserEntity> {
    readonly resourceType = 'User';
    private readonly logger = new Logger(UserPolicy.name);

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: EntityRepository<UserEntity>,
    ) {
        super();
    }

    async fetch(id: string): Promise<UserEntity | null> {
        this.logger.log(`Fetching User ${id} from Database...`);
        return this.userRepository.findOne({ id });
    }

    /**
     * Rule to check 'IsOwner'
     */
    @PolicyRule('IsOwner')
    checkOwner(user: PolicyUser, resource: UserEntity): boolean {
        this.logger.log(`Checking Ownership for User ${user.sub} and Resource ${resource.id}`);
        return user.sub === resource.id;
    }

    /**
     * Default rule for 'update' action
     */
    @PolicyRule('Update')
    canUpdate(user: PolicyUser, resource: UserEntity): boolean {
        const grantedPermissions = (user.permissions || []) as PermissionKey[];
        const hasUpdatePermission = PERMISSIONS.covers(grantedPermissions, P.user.update);

        return hasUpdatePermission || user.sub === resource.id;
    }

    /**
     * Default rule for 'read' action
     */
    @PolicyRule('Read')
    canRead(_user: PolicyUser, _resource: UserEntity): boolean {
        return true;
    }

    /**
     * Rule for 'delete' action
     * Only Admins or the Owner themselves can delete.
     */
    @PolicyRule('Delete')
    canDelete(user: PolicyUser, resource: UserEntity): boolean {
        const grantedPermissions = (user.permissions || []) as PermissionKey[];
        const hasDeletePermission = PERMISSIONS.covers(grantedPermissions, P.user.delete);

        // Ownership check or Delete permission
        return hasDeletePermission || user.sub === resource.id;
    }
}
