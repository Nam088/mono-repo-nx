import type {
    ActionDef,
    GroupDef,
    PermissionDef,
    PermissionDefinition,
    PermissionListItem,
    PermissionRegistry,
} from './types';

interface KeyMeta {
    readonly resource: string;
    readonly name: string;
    readonly def: PermissionDef<string>;
    readonly kind: 'action' | 'group';
}

function isGroupDef(def: PermissionDef<string>): def is GroupDef<string> {
    return (def as GroupDef<string>).includes !== undefined;
}

/**
 * Aggregates multiple `PermissionDefinition` entries into one central registry with:
 * - Precomputed expansion (transitive closure) for both actions and groups
 * - Type-safe `refs` namespace (`P.user.create` -> `'user:create'`)
 * - Runtime validation: duplicate resources/keys, missing references, group->group references,
 *   action->group implies, and implication cycles
 *
 * This runs once at startup; runtime lookups are O(1) afterwards.
 */
export function buildRegistry<const Defs extends readonly PermissionDefinition<string, string>[]>(
    defs: Defs,
): PermissionRegistry<Defs> {
    const resourceList: string[] = [];
    const allKeys: string[] = [];
    const actionKeys: string[] = [];
    const groupKeys: string[] = [];
    const meta = new Map<string, KeyMeta>();
    const byResource: Record<string, ReadonlyArray<string>> = {};
    const refs: Record<string, Readonly<Record<string, string>>> = {};

    for (const def of defs) {
        if (meta.has(`${def.resource}:`) || resourceList.includes(def.resource)) {
            throw new Error(`Duplicate resource declaration: "${def.resource}".`);
        }
        resourceList.push(def.resource);

        const namesInResource: string[] = [];
        const refMap: Record<string, string> = {};

        for (const [name, rawEntry] of Object.entries(def.actions)) {
            const entry = rawEntry as PermissionDef<string>;
            const key = `${def.resource}:${name}`;

            if (meta.has(key)) {
                throw new Error(`Duplicate key "${key}" in resource "${def.resource}".`);
            }

            const kind: 'action' | 'group' = isGroupDef(entry) ? 'group' : 'action';

            if (kind === 'group') {
                const group = entry as GroupDef<string>;
                if (group.includes.length === 0) {
                    throw new Error(`Group "${key}" must declare at least one item in "includes".`);
                }
                if ((group as PermissionDef<string> & { implies?: unknown }).implies !== undefined) {
                    throw new Error(`Group "${key}" cannot declare "implies"; use "includes" only.`);
                }
            }

            meta.set(key, { resource: def.resource, name, def: entry, kind });
            allKeys.push(key);
            if (kind === 'action') {
                actionKeys.push(key);
            } else {
                groupKeys.push(key);
            }
            namesInResource.push(name);
            refMap[name] = key;
        }

        byResource[def.resource] = Object.freeze([...namesInResource]) as ReadonlyArray<string>;
        refs[def.resource] = Object.freeze(refMap);
    }

    for (const [key, m] of meta.entries()) {
        if (m.kind === 'action') {
            const action = m.def as ActionDef<string>;
            for (const ref of action.implies ?? []) {
                const refKey = `${m.resource}:${ref}`;
                const refMeta = meta.get(refKey);
                if (!refMeta) {
                    throw new Error(`Action "${key}" implies non-existent key "${refKey}".`);
                }
                if (refMeta.kind === 'group') {
                    throw new Error(
                        `Action "${key}" cannot imply group "${refKey}"; implies must reference actions only.`,
                    );
                }
            }
        } else {
            const group = m.def as GroupDef<string>;
            for (const ref of group.includes) {
                const refKey = `${m.resource}:${ref}`;
                const refMeta = meta.get(refKey);
                if (!refMeta) {
                    throw new Error(`Group "${key}" includes non-existent key "${refKey}".`);
                }
                if (refMeta.kind === 'group') {
                    throw new Error(
                        `Group "${key}" cannot include another group "${refKey}"; includes must reference actions only.`,
                    );
                }
            }
        }
    }

    const expansion = new Map<string, Set<string>>();
    const stack: string[] = [];
    const stackSet = new Set<string>();

    function expandAction(key: string): Set<string> {
        const cached = expansion.get(key);
        if (cached) {
            return cached;
        }

        if (stackSet.has(key)) {
            const cycleStart = stack.indexOf(key);
            const cyclePath = [...stack.slice(cycleStart), key].join(' -> ');
            throw new Error(`Cycle detected in "implies": ${cyclePath}.`);
        }

        const m = meta.get(key);
        if (!m || m.kind !== 'action') {
            throw new Error(`Internal: cannot expand non-action key "${key}".`);
        }

        stack.push(key);
        stackSet.add(key);

        const result = new Set<string>([key]);
        const action = m.def as ActionDef<string>;
        for (const implied of action.implies ?? []) {
            const implKey = `${m.resource}:${implied}`;
            for (const s of expandAction(implKey)) {
                result.add(s);
            }
        }

        stack.pop();
        stackSet.delete(key);
        expansion.set(key, result);
        return result;
    }

    for (const key of actionKeys) {
        expandAction(key);
    }

    for (const key of groupKeys) {
        const m = meta.get(key);
        if (!m) {
            continue;
        }
        const group = m.def as GroupDef<string>;
        const result = new Set<string>();
        for (const inc of group.includes) {
            const incKey = `${m.resource}:${inc}`;
            const sub = expansion.get(incKey);
            if (sub) {
                for (const s of sub) {
                    result.add(s);
                }
            }
        }
        expansion.set(key, result);
    }

    function has(input: string): boolean {
        return meta.has(input);
    }
    function isAction(input: string): boolean {
        return meta.get(input)?.kind === 'action';
    }
    function isGroup(input: string): boolean {
        return meta.get(input)?.kind === 'group';
    }
    function expand(input: string): ReadonlySet<string> {
        return expansion.get(input) ?? new Set<string>();
    }
    function covers(granted: Iterable<string>, required: string): boolean {
        const requiredSet = expansion.get(required);
        if (!requiredSet || requiredSet.size === 0) {
            return false;
        }
        const effective = new Set<string>();
        for (const g of granted) {
            const exp = expansion.get(g);
            if (!exp) {
                continue;
            }
            for (const e of exp) {
                effective.add(e);
            }
        }
        for (const r of requiredSet) {
            if (!effective.has(r)) {
                return false;
            }
        }
        return true;
    }
    function list(): ReadonlyArray<PermissionListItem<string>> {
        return Object.freeze(
            allKeys.map((key) => {
                const m = meta.get(key);
                if (!m) {
                    throw new Error(`Internal: missing meta for "${key}".`);
                }
                return Object.freeze({
                    key,
                    resource: m.resource,
                    name: m.name,
                    kind: m.kind,
                    description: m.def.description,
                    expandsTo: Object.freeze([...(expansion.get(key) ?? [])]) as ReadonlyArray<string>,
                });
            }),
        );
    }

    const registry = {
        keys: Object.freeze([...allKeys]),
        actionKeys: Object.freeze([...actionKeys]),
        groupKeys: Object.freeze([...groupKeys]),
        resources: Object.freeze([...resourceList]),
        refs: Object.freeze(refs),
        byResource: Object.freeze(byResource),
        has,
        isAction,
        isGroup,
        expand,
        covers,
        list,
    };

    return Object.freeze(registry) as unknown as PermissionRegistry<Defs>;
}
