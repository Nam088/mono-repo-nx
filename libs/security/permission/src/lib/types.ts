/**
 * ActionDef describes one atomic permission.
 *
 * - `description`: required, used by catalogs/admin UI/logging.
 * - `implies`: optional. Granting this action automatically grants the listed actions.
 *   Example: `update: { implies: ['read'] }` means anyone with `update` also has `read`.
 *
 */
export interface ActionDef<A extends string> {
    readonly description: string;
    readonly implies?: readonly A[];
    readonly includes?: never;
}

/**
 * GroupDef groups multiple actions under one alias.
 */
export interface GroupDef<A extends string> {
    readonly description: string;
    readonly includes: readonly A[];
    readonly implies?: never;
}

/**
 * Each entry in the `actions` map is either an action or a group, discriminated by shape:
 * - has `includes` => group
 * - no `includes` => action
 */
export type PermissionDef<A extends string> = ActionDef<A> | GroupDef<A>;

/**
 * Declares permissions for a single resource.
 *
 * This shape is produced by `definePermissions(...)` and should not be manually instantiated.
 */
export interface PermissionDefinition<R extends string, K extends string> {
    readonly resource: R;
    readonly description?: string;
    readonly actions: { readonly [N in K]: PermissionDef<K> };
}

/**
 * Canonical permission key format: `resource:name`.
 */
export type PermissionKeyOf<D> = D extends PermissionDefinition<infer R, infer K> ? `${R}:${K}` : never;

/**
 * Nested namespace by resource, enabling `P.user.create` ergonomics.
 *
 * Hovering `P.user.create` shows the literal type `'user:create'`.
 */
export type RefsOf<Defs extends readonly PermissionDefinition<string, string>[]> = {
    readonly [D in Defs[number] as D['resource']]: D extends PermissionDefinition<infer R, infer K>
        ? { readonly [N in K]: `${R}:${N}` }
        : never;
};

/**
 * One catalog entry returned by `registry.list()`.
 */
export interface PermissionListItem<Key extends string> {
    readonly key: Key;
    readonly resource: string;
    readonly name: string;
    readonly kind: 'action' | 'group';
    readonly description: string;
    readonly expandsTo: ReadonlyArray<Key>;
}

/**
 * Aggregated registry returned by `buildRegistry(...)`.
 */
export interface PermissionRegistry<Defs extends readonly PermissionDefinition<string, string>[]> {
    readonly keys: ReadonlyArray<PermissionKeyOf<Defs[number]>>;
    readonly actionKeys: ReadonlyArray<PermissionKeyOf<Defs[number]>>;
    readonly groupKeys: ReadonlyArray<PermissionKeyOf<Defs[number]>>;
    readonly resources: ReadonlyArray<Defs[number]['resource']>;
    readonly refs: RefsOf<Defs>;
    readonly byResource: {
        readonly [D in Defs[number] as D['resource']]: D extends PermissionDefinition<string, infer K>
            ? ReadonlyArray<K>
            : never;
    };
    has(key: string): key is PermissionKeyOf<Defs[number]>;
    isAction(key: PermissionKeyOf<Defs[number]>): boolean;
    isGroup(key: PermissionKeyOf<Defs[number]>): boolean;
    expand(key: PermissionKeyOf<Defs[number]>): ReadonlySet<PermissionKeyOf<Defs[number]>>;
    covers(granted: Iterable<PermissionKeyOf<Defs[number]>>, required: PermissionKeyOf<Defs[number]>): boolean;
    list(): ReadonlyArray<PermissionListItem<PermissionKeyOf<Defs[number]>>>;
    getKeysByResource(resource: Defs[number]['resource']): ReadonlyArray<PermissionKeyOf<Defs[number]>>;
}
