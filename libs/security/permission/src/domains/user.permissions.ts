import { definePermissions } from '../lib/define-permissions';

export const userPermissions = definePermissions({
    resource: 'user',
    description: 'User domain permissions: profile access and user lifecycle management.',
    actions: {
        read: { description: 'View user profile.' },
        create: { description: 'Create a new user.' },
        update: { description: 'Update user profile.', implies: ['read'] },
        delete: { description: 'Delete a user.', implies: ['read'] },
        manage: {
            description: 'Full management of users.',
            includes: ['read', 'create', 'update', 'delete'],
        },
    },
});
