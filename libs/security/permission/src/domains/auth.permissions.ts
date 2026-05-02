import { definePermissions } from '../lib/define-permissions';

export const authPermissions = definePermissions({
    resource: 'auth',
    description: 'Authentication domain permissions: login, refresh, revoke, and registration.',
    actions: {
        login: { description: 'Sign in with credentials and receive an access token.' },
        refresh: { description: 'Exchange a refresh token for a new access token.' },
        revoke: { description: 'Revoke an active session/refresh token.' },
        register: { description: 'Create a new account.' },
    },
});
