import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import type { PermissionKey, PolicyUser } from '@nam088/permission';
import { P, PERMISSIONS, PolicyRule, ResourcePolicy } from '@nam088/permission';
import { UserEntity } from '@nam088/postgresql';
import { Injectable } from '@nestjs/common';

declare module '@nam088/permission' {
    interface AppPolicyMap {
        User: 'Read' | 'Update' | 'IsOwner' | 'Delete';
    }
}

@Injectable()
export class UserPolicy extends ResourcePolicy<UserEntity> {
    readonly resourceType = 'User';

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: EntityRepository<UserEntity>,
    ) {
        super();
    }

    async fetch(id: string): Promise<UserEntity | null> {
        console.log(`[UserPolicy] Fetching User ${id} from Database...`);
        const user = await this.userRepository.findOne({ id });
        console.dir(user, { depth: null });
        return user;
    }

    /**
     * Rule to check 'IsOwner'
     */
    @PolicyRule('IsOwner')
    checkOwner(user: PolicyUser, resource: UserEntity): boolean {
        console.log(`[UserPolicy] Checking Ownership for User ${user.sub} and Resource ${resource.id}`);
        return user.sub === resource.id;
    }

    /**
     * Default rule for 'update' action
     */
    @PolicyRule('Update')
    canUpdate(user: PolicyUser, resource: UserEntity): boolean {
        const grantedPermissions = (user.permissions || []) as PermissionKey[];
        const isAdmin = PERMISSIONS.covers(grantedPermissions, P.user.manage);
        return isAdmin || user.sub === resource.id;
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
        const isAdmin = PERMISSIONS.covers(grantedPermissions, P.user.manage);

        // Ownership check or Admin override
        return isAdmin || user.sub === resource.id;
    }
}
