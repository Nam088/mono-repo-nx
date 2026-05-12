import { defineRole } from '../lib/define-role';
import { allP, P } from '../registry';

export const adminRole = defineRole({
    name: 'ADMIN',
    description: 'Administrative access for user management',
    permissions: [P.auth.login, P.auth.register, P.auth.refresh, P.auth.revoke, ...allP('user')],
});
