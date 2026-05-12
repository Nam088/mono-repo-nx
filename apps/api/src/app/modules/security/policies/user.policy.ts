import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import type { PermissionKey, PolicyUser } from '@nam088/permission';
import { P, PERMISSIONS, PolicyRule, ResourcePolicy } from '@nam088/permission';
import { UserEntity } from '@nam088/postgresql';
import { Injectable } from '@nestjs/common';

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
        return this.userRepository.findOne({ id });
    }

    /**
     * Rule to check 'IsOwner'
     */
    @PolicyRule('IsOwner')
    checkOwner(user: PolicyUser, resource: UserEntity): boolean {
        return user.sub === resource.id;
    }

    /**
     * Default rule for 'update' action
     */
    @PolicyRule('update')
    canUpdate(user: PolicyUser, resource: UserEntity): boolean {
        const grantedPermissions = (user.permissions || []) as PermissionKey[];
        const isAdmin = PERMISSIONS.covers(grantedPermissions, P.user.manage);
        return isAdmin || user.sub === resource.id;
    }

    /**
     * Default rule for 'read' action
     */
    @PolicyRule('read')
    canRead(_user: PolicyUser, _resource: UserEntity): boolean {
        return true;
    }

    /**
     * Rule for 'delete' action
     * Only Admins or the Owner themselves can delete.
     */
    @PolicyRule('delete')
    canDelete(user: PolicyUser, resource: UserEntity): boolean {
        const grantedPermissions = (user.permissions || []) as PermissionKey[];
        const isAdmin = PERMISSIONS.covers(grantedPermissions, P.user.manage);

        // Ownership check or Admin override
        return isAdmin || user.sub === resource.id;
    }
}
