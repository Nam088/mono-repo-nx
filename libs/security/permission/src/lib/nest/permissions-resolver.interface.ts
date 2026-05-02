/**
 * Context handed to a `PermissionsResolver`.
 *
 * `request` is opaque to the lib (HTTP, RPC, GraphQL, ...). `user.sub` is the
 * authenticated user id; additional claims are passed through unchanged.
 */
export interface PermissionsResolveContext {
    readonly request: unknown;
    readonly user: { readonly sub: string; readonly [key: string]: unknown };
}

export interface PermissionsAuthorizeContext extends PermissionsResolveContext {
    readonly requirement: {
        readonly mode: 'all' | 'any';
        readonly keys: readonly string[];
    };
}

/**
 * Strategy for resolving the set of permission keys granted to the caller.
 *
 * The library does not assume any particular role/grant storage; consumers
 * implement this interface (e.g. read from Redis session, DB lookup, JWT claim).
 *
 * The returned keys are matched against handler requirements via
 * `PERMISSIONS.covers`, which already expands `implies` / `includes`.
 *
 * For better scalability, resolvers may implement `authorize(...)` to delegate
 * the final decision to a remote PDP (e.g. auth service). The guard prefers
 * `authorize` when available, and falls back to `resolve` + local `covers`.
 */
export interface PermissionsResolver {
    resolve?(ctx: PermissionsResolveContext): Promise<readonly string[]> | readonly string[];
    authorize?(ctx: PermissionsAuthorizeContext): Promise<boolean> | boolean;
}
