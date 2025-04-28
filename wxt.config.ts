import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'wxt';

import { Command } from './constants/commands';

export default defineConfig({
    manifest: {
        name: 'Open Related Website',
        permissions: ['storage', 'commands'],
        commands: {
            [Command.ToggleExtension]: {
                suggested_key: {
                    default: 'Alt+O',
                },
                description: 'Activate or deactivate extension',
            },
        },
    },
    webExt: {
        chromiumArgs: [
            // '--auto-open-devtools-for-tabs',
            '--user-data-dir=./.wxt/chrome-data',
        ],
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
    alias: {
        '@/constants': resolve('constants'),
        '@/background': resolve('entrypoints/background'),
        '@/content': resolve('entrypoints/content'),
        '@/options': resolve('entrypoints/options'),
        '@/popup': resolve('entrypoints/popup'),
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
