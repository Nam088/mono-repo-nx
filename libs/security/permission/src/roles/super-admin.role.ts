import { defineRole } from '../lib/define-role';
import { P } from '../registry';

export const superAdminRole = defineRole({
    name: 'SUPER_ADMIN',
    description: 'Full system access',
    permissions: [P.auth.login, P.auth.refresh, P.auth.revoke, P.auth.register, P.user.manage],
});
