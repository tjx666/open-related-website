<script lang="ts" setup>
import './monaco.worker';

import { onBeforeUnmount, onMounted, ref, toRaw } from 'vue';

import { message } from 'ant-design-vue';
import type { editor as MonacoEditor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { sendMessage } from 'webext-bridge/options';

import { JsonRule } from '@/background/rules/BaseRule';

import { i18n } from '#i18n';

import { rulesSchema } from './rulesSchema';

const monacoEl = ref<HTMLDivElement>();
const _editorVueWrapper = ref<MonacoEditor.IStandaloneCodeEditor>();
const loading = ref(true);

const getEditor = () => {
    return toRaw(_editorVueWrapper.value);
};
/**
 * Load user rules
 */
async function loadUserRules() {
    try {
        const allRules = await sendMessage('getRules', {});
        // Only display non-builtin rules (user rules)
        const userRules = allRules.filter((rule) => !rule.isBuiltin);

        // Format rules as pretty JSON string
        const initialContent = JSON.stringify(userRules, null, 4);

        // If editor is initialized, update content
        if (_editorVueWrapper.value) {
            getEditor()!.setValue(initialContent);
        }
    } catch (error) {
        console.error('Failed to get rules:', error);
        message.error(i18n.t('options.rulesEditor.getRulesFailed'));
    }
}

/**
 * Check if the editor has errors
 */
function hasEditorErrors(): boolean {
    if (!_editorVueWrapper.value) return true;

    // Get all markers in the editor (errors, warnings, etc.)
    const model = getEditor()?.getModel();
    if (!model) return true;

    const markers = monaco.editor.getModelMarkers({ resource: model.uri });

    // Only care about error level markers
    return markers.some((marker) => marker.severity === monaco.MarkerSeverity.Error);
}

/**
 * Save rules
 */
async function saveRules() {
    if (!_editorVueWrapper.value) return;

    loading.value = true;
    try {
        // Check if the editor has errors
        if (hasEditorErrors()) {
            message.error(i18n.t('options.rulesEditor.fixErrorsBeforeSaving'));
            return;
        }

        try {
            const content = getEditor()!.getValue();

            // Try to parse JSON
            const parsedRules = JSON.parse(content) as JsonRule[];

            console.log('aaaaaa');

            // Validate url and urlPattern in each rule
            // Extra validation to ensure at least one of urlPattern or url exists
            for (const [i, rule] of parsedRules.entries() as unknown as Array<[number, JsonRule]>) {
                if (rule.relatedWebsites) {
                    for (let j = 0; j < rule.relatedWebsites.length; j++) {
                        const website = rule.relatedWebsites[j];
                        if (!website.url && !website.urlPattern) {
                            message.error(
                                i18n.t('options.rulesEditor.specifyUrlOrPattern', [
                                    rule.name || i + 1,
                                    website.title || j + 1,
                                ]),
                            );
                            return;
                        }
                    }
                }
            }

            console.log('bbbbbb');

            // Validate rule names must be unique
            const ruleNames = parsedRules.map((rule) => rule.name);
            const uniqueRuleNames = new Set(ruleNames);
            if (uniqueRuleNames.size !== ruleNames.length) {
                message.error(i18n.t('options.rulesEditor.duplicateRuleNames'));
                return;
            }

            await sendMessage('saveRules', { rules: parsedRules });
            message.success(i18n.t('options.rulesEditor.rulesSavedSuccess'));
            await loadUserRules();
        } catch (error) {
            console.error('Failed to parse JSON:', error);
            message.error(i18n.t('options.rulesEditor.jsonFormatError'));
        }
    } catch (error) {
        console.error('Failed to save rules:', error);
        message.error(i18n.t('options.rulesEditor.saveRulesFailed'));
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    loading.value = true;
    try {
        // Configure editor
        if (monacoEl.value) {
            // Create editor
            _editorVueWrapper.value = monaco.editor.create(monacoEl.value, {
                value: '[]',
                language: 'json',
                minimap: {
                    enabled: false,
                },
                automaticLayout: true,
            });

            // Configure JSON language settings
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: true,
                allowComments: false,
                schemaValidation: 'error',
                schemas: [
                    {
                        uri: 'inmemory://schema/rule-schema.json',
                        fileMatch: ['*'],
                        schema: rulesSchema,
                    },
                ],
            });

            await loadUserRules();
        }
    } catch (error) {
        console.error('Failed to initialize editor:', error);
        message.error(i18n.t('options.rulesEditor.initEditorFailed'));
    } finally {
        loading.value = false;
    }
});

onBeforeUnmount(() => {
    if (_editorVueWrapper.value) {
        getEditor()?.dispose();
    }
});
</script>

<template>
    <div class="flex h-screen flex-col">
        <div class="flex h-16 items-center justify-between border-b px-8">
            <h1 class="text-lg font-semibold">{{ i18n.t('options.rulesEditor.title') }}</h1>
            <a-button type="primary" :loading="loading" @click="saveRules">{{
                i18n.t('options.rulesEditor.saveRules')
            }}</a-button>
        </div>

        <div v-if="loading && !_editorVueWrapper" class="flex h-full items-center justify-center">
            <a-spin size="large" />
        </div>

        <div class="mb-4 px-8 pt-4 text-sm text-gray-500">
            <h2 class="pb-4">{{ i18n.t('options.rulesEditor.description') }}</h2>
            <ul class="list-disc">
                <li>
                    <p>{{ i18n.t('options.rulesEditor.jsonFormatTip') }}</p>
                </li>

                <li>
                    <p>{{ i18n.t('options.rulesEditor.urlPatternTip') }}</p>
                </li>

                <li>
                    <p>{{ i18n.t('options.rulesEditor.uniqueNameTip') }}</p>
                </li>
            </ul>
        </div>

        <div ref="monacoEl" class="w-full flex-1 px-8 pb-8"></div>
    </div>
</template>

<style scoped>
:deep(.monaco-editor) {
    padding-top: 10px;
}
</style>
