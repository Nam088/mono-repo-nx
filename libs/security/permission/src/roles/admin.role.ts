import { defineRole } from '../lib/define-role';
import { allP, P } from '../registry';

export const adminRole = defineRole({
    name: 'ADMIN',
    description: 'Administrative access for user management',
    permissions: [
        P.auth.login,
        P.auth.refresh,
        P.auth.revoke,
        P.user.read,
        P.user.create,
        P.user.update,
        ...allP('user'),
    ],
});
