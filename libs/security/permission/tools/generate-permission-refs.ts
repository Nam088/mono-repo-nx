import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { authPermissions } from '../src/domains/auth.permissions';
import { userPermissions } from '../src/domains/user.permissions';

type PermissionDef = {
    readonly resource: string;
    readonly description?: string;
    readonly actions: Record<
        string,
        {
            readonly description: string;
            readonly implies?: readonly string[];
            readonly includes?: readonly string[];
        }
    >;
};

function toDocLine(text: string): string {
    // Escape closing comment sequence to keep generated JSDoc valid.
    return text.replaceAll('*/', '*\\/');
}

/**
 * Emits a JSDoc block following common conventions:
 * - First paragraph: human-readable summary (implicit `@description`).
 * - `@remarks`: structured metadata (bullets) for IDE hover.
 *
 * @see https://jsdoc.app/tags-remarks.html
 */
function pushJsDocBlock(lines: string[], indent: string, summary: string, remarksLines: readonly string[]): void {
    lines.push(`${indent}/**`);
    lines.push(`${indent} * ${toDocLine(summary)}`);
    if (remarksLines.length > 0) {
        lines.push(`${indent} *`);
        lines.push(`${indent} * @remarks`);
        for (const line of remarksLines) {
            lines.push(`${indent} * ${toDocLine(line)}`);
        }
    }
    lines.push(`${indent} */`);
}

function generateRefsFile(defs: readonly PermissionDef[]): string {
    const lines: string[] = [];

    lines.push('// AUTO-GENERATED FILE. DO NOT EDIT.');
    lines.push('// Run: nx run permission:generate-refs');
    lines.push('');
    lines.push('export const P = {');

    for (const def of defs) {
        const resourceSummary = def.description ?? `Permissions for the \`${def.resource}\` resource namespace.`;
        pushJsDocBlock(lines, '    ', resourceSummary, [`- **Resource:** \`${def.resource}\``]);
        lines.push(`    ${def.resource}: {`);

        for (const [name, entry] of Object.entries(def.actions)) {
            const fullKey = `${def.resource}:${name}`;
            const remarks: string[] = [`- **Key:** \`${fullKey}\``];
            if (entry.implies && entry.implies.length > 0) {
                const targets = entry.implies.map((a) => `\`${def.resource}:${a}\``).join(', ');
                remarks.push(`- **Implies:** ${targets} (granting this permission also grants these actions).`);
            }
            if (entry.includes && entry.includes.length > 0) {
                const members = entry.includes.map((a) => `\`${def.resource}:${a}\``).join(', ');
                remarks.push(`- **Includes:** ${members} (group expands to these actions).`);
            }
            pushJsDocBlock(lines, '        ', entry.description, remarks);
            lines.push(`        ${name}: '${def.resource}:${name}',`);
        }

        lines.push('    },');
    }

    lines.push('} as const;');
    lines.push('');

    return lines.join('\n');
}

const outputPath = resolve(process.cwd(), 'libs/security/permission/src/refs.generated.ts');
const defs = [authPermissions, userPermissions] as const;

writeFileSync(outputPath, generateRefsFile(defs), 'utf8');
console.log(`Generated ${outputPath}`);
