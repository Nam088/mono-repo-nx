import { ZodError } from 'zod';

import { envSchema } from './env.schema';

export function validateEnv(config: Record<string, unknown>) {
    const parsed = envSchema.safeParse(config);
    if (!parsed.success) {
        throw new Error(buildEnvValidationMessage(parsed.error));
    }

    return parsed.data;
}

export function parseEnv(config: Record<string, unknown>) {
    return validateEnv(config);
}

function buildEnvValidationMessage(error: ZodError): string {
    const details = error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`).join('; ');

    return `Invalid environment variables: ${details}`;
}
