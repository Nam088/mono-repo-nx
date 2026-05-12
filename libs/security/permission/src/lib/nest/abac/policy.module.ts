import { DynamicModule, Global, Module, Type } from '@nestjs/common';

import { PolicyGuard } from './policy.guard';
import { PolicyRegistry } from './policy.registry';
import { ResourcePolicy } from './resource-policy.base';

export interface PolicyModuleOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly policies: Type<ResourcePolicy<any>>[];
    readonly imports?: DynamicModule['imports'];
}

@Global()
@Module({
    providers: [PolicyRegistry, PolicyGuard],
    exports: [PolicyRegistry, PolicyGuard],
})
export class PolicyModule {
    /**
     * Initialize the module with a list of Policy classes.
     * Uses the Factory Pattern to automatically register them into the Registry.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static forRoot(options: Type<ResourcePolicy<any>>[] | PolicyModuleOptions): DynamicModule {
        const policies = Array.isArray(options) ? options : options.policies;
        const imports = Array.isArray(options) ? [] : (options.imports ?? []);

        return {
            module: PolicyModule,
            imports,
            providers: [
                {
                    provide: 'INITIAL_POLICIES',
                    useFactory: async (registry: PolicyRegistry) => {
                        for (const policy of policies) {
                            await registry.register(policy);
                        }
                    },
                    inject: [PolicyRegistry],
                },
            ],
        };
    }
}
