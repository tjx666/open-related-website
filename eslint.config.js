import yutengjingEslintConfigVue from '@yutengjing/eslint-config-vue';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    yutengjingEslintConfigVue,
    {
        rules: {
            'import-x/no-unresolved': [
                'error',
                {
                    ignore: ['^#'],
                },
            ],
        },
    },
]);
