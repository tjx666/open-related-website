<script lang="ts" setup>
import './monaco.worker';

import { onBeforeUnmount, onMounted, ref } from 'vue';

import { editor as MonacoEditor, languages } from 'monaco-editor/esm/vs/editor/editor.api';

import jsonRuleTemplate from './jsonRuleTemplate.jsonc?raw';

const monacoEl = ref<HTMLDivElement>();
const editor = ref<MonacoEditor.IStandaloneCodeEditor>();

onMounted(() => {
    // 配置编辑器
    editor.value = MonacoEditor.create(monacoEl.value!, {
        value: jsonRuleTemplate,
        language: 'json', // 使用 json 语言模式，它同样可以处理 jsonc
        minimap: {
            enabled: false,
        },
        automaticLayout: true,
    });

    // 配置 JSON 语言设置 (全局设置，允许注释)
    languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: true,
        schemas: [
            {
                uri: 'inmemory://schema/rule-schema.json',
                fileMatch: ['*'],
                schema: {
                    type: 'object',
                    properties: {
                        language: {
                            type: 'string',
                            description: '规则语言类型',
                            default: 'json',
                        },
                        name: {
                            type: 'string',
                            description: '规则名称',
                        },
                        description: {
                            type: 'string',
                            description: '规则描述',
                        },
                        matchPageRegexpPatterns: {
                            type: 'array',
                            description: 'URL匹配正则表达式',
                            items: {
                                type: 'string',
                            },
                        },
                        relatedWebsites: {
                            type: 'array',
                            description: '相关网站列表',
                            items: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string', description: '标题' },
                                    name: { type: 'string', description: '唯一标识名' },
                                    description: { type: 'string', description: '描述' },
                                    urlPattern: {
                                        type: 'string',
                                        description: '带占位符的URL模板',
                                    },
                                    url: { type: 'string', description: '不带占位符的直接URL' },
                                    icon: { type: 'string', description: '图标URL' },
                                    openInNewTab: {
                                        type: 'boolean',
                                        description: '是否在新标签页打开',
                                    },
                                },
                                required: ['title', 'description'],
                            },
                        },
                    },
                    required: [
                        'language',
                        'name',
                        'description',
                        'matchPageRegexpPatterns',
                        'relatedWebsites',
                    ],
                },
            },
        ],
    });
});

/**
 * 保存规则
 */
function saveRule() {
    if (!editor.value) return;

    try {
        const content = editor.value.getValue();
        const ruleObject = JSON.parse(content);

        // TODO: 使用 sendMessage 或其他方式将规则发送到后台
        console.log('保存规则:', ruleObject);

        // 可以在这里添加保存成功的提示
    } catch (error: any) {
        console.error('保存失败:', error.message);
        // 可以在这里添加错误提示
    }
}

// 清理资源
onBeforeUnmount(() => {
    if (editor.value) {
        editor.value.dispose();
    }
});
</script>

<template>
    <div class="flex h-screen flex-col">
        <div class="flex h-16 items-center justify-between border-b px-4">
            <h2 class="text-lg font-semibold">添加自定义规则</h2>
            <a-button type="primary" @click="saveRule">保存规则</a-button>
        </div>

        <div ref="monacoEl" class="w-full flex-1"></div>
    </div>
</template>
