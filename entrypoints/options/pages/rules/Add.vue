<script lang="ts" setup>
import './monaco.worker';

import { onMounted, ref } from 'vue';

import { editor as MonacoEditor } from 'monaco-editor/esm/vs/editor/editor.api';

import jsonRuleTemplate from './jsonRuleTemplate.json?raw';

const monacoEl = ref<HTMLDivElement>();
const editor = ref<MonacoEditor.IStandaloneCodeEditor>();

onMounted(() => {
    editor.value = MonacoEditor.create(monacoEl.value!, {
        value: jsonRuleTemplate,
        language: 'json',
        minimap: {
            enabled: false,
        },
    });
});
</script>

<template>
    <div class="flex h-screen flex-col">
        <div class="flex h-16 items-center px-2">
            <a-button type="primary">保存规则</a-button>
        </div>

        <div ref="monacoEl" class="w-full flex-1"></div>
    </div>
</template>
