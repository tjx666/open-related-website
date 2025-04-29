<script lang="ts" setup>
import './monaco.worker';

import { onBeforeUnmount, onMounted, ref, toRaw } from 'vue';

import { message } from 'ant-design-vue';
import type { editor as MonacoEditor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { sendMessage } from 'webext-bridge/options';

import { JsonRule } from '@/background/rules/BaseRule';

import { rulesSchema } from './rulesSchema';

const monacoEl = ref<HTMLDivElement>();
const _editorVueWrapper = ref<MonacoEditor.IStandaloneCodeEditor>();
const loading = ref(true);

const getEditor = () => {
    return toRaw(_editorVueWrapper.value);
};

/**
 * 加载用户规则
 */
async function loadUserRules() {
    try {
        const allRules = await sendMessage('getRules', {});
        // 只显示非内置规则（用户规则）
        const userRules = allRules.filter((rule) => !rule.isBuiltin);

        // 将规则格式化为漂亮的 JSON 字符串
        const initialContent = JSON.stringify(userRules, null, 4);

        // 如果编辑器已初始化，更新内容
        if (_editorVueWrapper.value) {
            getEditor()!.setValue(initialContent);
        }
    } catch (error) {
        console.error('获取规则失败:', error);
        message.error('获取规则失败');
    }
}

/**
 * 检查编辑器是否有错误
 */
function hasEditorErrors(): boolean {
    if (!_editorVueWrapper.value) return true;

    // 获取编辑器中所有的标记（错误、警告等）
    const model = getEditor()?.getModel();
    if (!model) return true;

    const markers = monaco.editor.getModelMarkers({ resource: model.uri });

    // 只关注错误级别的标记
    return markers.some((marker) => marker.severity === monaco.MarkerSeverity.Error);
}

/**
 * 保存规则
 */
async function saveRules() {
    if (!_editorVueWrapper.value) return;

    loading.value = true;
    try {
        // 检查编辑器是否有错误
        if (hasEditorErrors()) {
            message.error('编辑器中存在错误，请修复后再保存');
            return;
        }

        try {
            const content = getEditor()!.getValue();

            // 尝试解析 JSON
            const parsedRules = JSON.parse(content) as JsonRule[];

            // 验证每个规则中的 url 和 urlPattern
            // 额外验证 urlPattern 和 url 逻辑，确保至少有一个存在
            let hasUrlError = false;
            for (const [i, rule] of parsedRules.entries() as unknown as Array<[number, JsonRule]>) {
                if (rule.relatedWebsites) {
                    for (let j = 0; j < rule.relatedWebsites.length; j++) {
                        const website = rule.relatedWebsites[j];
                        if (!website.url && !website.urlPattern) {
                            message.error(
                                `规则 ${i + 1} 的相关网站 ${j + 1} 必须指定 url 或 urlPattern 中的一个`,
                            );
                            hasUrlError = true;
                        }
                    }
                }
            }

            if (hasUrlError) {
                return;
            }

            // 验证规则名称不能重复
            const ruleNames = parsedRules.map((rule) => rule.name);
            const uniqueRuleNames = new Set(ruleNames);
            if (uniqueRuleNames.size !== ruleNames.length) {
                message.error('规则名称不能重复');
                return;
            }

            await sendMessage('saveRules', { rules: parsedRules });
            message.success('规则保存成功');
            await loadUserRules();
        } catch (error) {
            console.error('解析 JSON 失败:', error);
            message.error('JSON 格式错误，请检查');
        }
    } catch (error) {
        console.error('保存规则失败:', error);
        message.error('保存规则失败');
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    loading.value = true;
    try {
        // 配置编辑器
        if (monacoEl.value) {
            // 创建编辑器
            _editorVueWrapper.value = monaco.editor.create(monacoEl.value, {
                value: '[]',
                language: 'json',
                minimap: {
                    enabled: false,
                },
                automaticLayout: true,
            });

            // 配置 JSON 语言设置
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
        console.error('初始化编辑器失败:', error);
        message.error('初始化编辑器失败');
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
            <h1 class="text-lg font-semibold">规则编辑器</h1>
            <a-button type="primary" :loading="loading" @click="saveRules">保存规则</a-button>
        </div>

        <div v-if="loading && !_editorVueWrapper" class="flex h-full items-center justify-center">
            <a-spin size="large" />
        </div>

        <div class="mb-4 px-8 pt-4 text-sm text-gray-500">
            <h2 class="pb-4">在此编辑器中，您可以直接编辑、导入和导出所有用户规则。</h2>
            <ul class="list-disc">
                <li>
                    <p>规则采用 JSON 格式，支持 json schema 验证，hover 到字段上会显示描述。</p>
                </li>

                <li>
                    <p>每个相关网站必须至少指定 url 或 urlPattern 中的一个。</p>
                </li>

                <li>
                    <p>规则名称不能重复。</p>
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
