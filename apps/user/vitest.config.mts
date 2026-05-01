import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/user',
    plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
    test: {
        name: 'user',
        watch: false,
        passWithNoTests: true,
        globals: true,
        environment: 'jsdom',
        include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        reporters: ['default'],
        coverage: {
            reportsDirectory: '../../coverage/apps/user',
            provider: 'v8' as const,
        },
    },
}));
