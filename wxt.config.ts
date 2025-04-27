import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
    manifest: {
        name: 'Open Related Website',
        permissions: ['storage'],
        commands: {
            toggleExtension: {
                suggested_key: {
                    default: 'Alt+O',
                },
                description: 'Activate or deactivate extension',
            },
        },
    },
    webExt: {
        chromiumArgs: ['--auto-open-devtools-for-tabs'],
        startUrls: [
            'https://github.com/lodash/lodash',
            'chrome-extension://ooofpdndalnjbinlmpnhchakfihegmgc/options.html',
        ],
    },
    imports: {
        addons: {
            vueTemplate: true,
        },
    },
    vite: () => ({
        css: {
            devSourcemap: true,
        },
        plugins: [
            tailwindcss(),
            vue(),
            Components({
                resolvers: [
                    AntDesignVueResolver({
                        importStyle: false,
                    }),
                ],
            }),
        ],
    }),
});
