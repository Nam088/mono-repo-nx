// AUTO-GENERATED FILE. DO NOT EDIT.
// Run: nx run permission:generate-refs

export const P = {
    /**
     * Authentication domain permissions: login, refresh, revoke, and registration.
     *
     * @remarks
     * - **Resource:** `auth`
     */
    auth: {
        /**
         * Sign in with credentials and receive an access token.
         *
         * @remarks
         * - **Key:** `auth:login`
         */
        login: 'auth:login',
        /**
         * Exchange a refresh token for a new access token.
         *
         * @remarks
         * - **Key:** `auth:refresh`
         */
        refresh: 'auth:refresh',
        /**
         * Revoke an active session/refresh token.
         *
         * @remarks
         * - **Key:** `auth:revoke`
         */
        revoke: 'auth:revoke',
        /**
         * Create a new account.
         *
         * @remarks
         * - **Key:** `auth:register`
         */
        register: 'auth:register',
    },
    /**
     * User domain permissions: profile access and user lifecycle management.
     *
     * @remarks
     * - **Resource:** `user`
     */
    user: {
        /**
         * View user profile.
         *
         * @remarks
         * - **Key:** `user:read`
         */
        read: 'user:read',
        /**
         * Create a new user.
         *
         * @remarks
         * - **Key:** `user:create`
         */
        create: 'user:create',
        /**
         * Update user profile.
         *
         * @remarks
         * - **Key:** `user:update`
         * - **Implies:** `user:read` (granting this permission also grants these actions).
         */
        update: 'user:update',
        /**
         * Delete a user.
         *
         * @remarks
         * - **Key:** `user:delete`
         * - **Implies:** `user:read` (granting this permission also grants these actions).
         */
        delete: 'user:delete',
        /**
         * Full management of users.
         *
         * @remarks
         * - **Key:** `user:manage`
         * - **Includes:** `user:read`, `user:create`, `user:update`, `user:delete` (group expands to these actions).
         */
        manage: 'user:manage',
    },
} as const;
