import { defineRole } from '../lib/define-role';
import { P } from '../registry';

export const userRole = defineRole({
    name: 'USER',
    description: 'Standard user access',
    permissions: [P.auth.login, P.auth.refresh, P.auth.revoke, P.user.read],
});
