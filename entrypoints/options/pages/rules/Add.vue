<script lang="ts" setup>
import type { UnwrapRef } from 'vue';
import { nextTick, reactive, ref, toRaw } from 'vue';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';
import { sendMessage } from 'webext-bridge/options';

// 表单数据接口
interface FormState {
    language: string;
    name: string;
    description: string;
    matchPageRegexpPatterns: string[];
    relatedWebsites: Array<{
        title: string;
        description: string;
        urlPattern: string;
        url: string;
        icon: string;
        openInNewTab: boolean;
    }>;
}

// 表单数据
const formState: UnwrapRef<FormState> = reactive({
    language: 'json',
    name: '',
    description: '',
    matchPageRegexpPatterns: [''],
    relatedWebsites: [
        {
            title: '',
            description: '',
            urlPattern: '',
            url: '',
            icon: '',
            openInNewTab: true,
        },
    ],
});

// 表单布局
const labelCol = { span: 6 };
const wrapperCol = { span: 18 };

// 表单验证规则
const rules: Record<string, Rule[]> = {
    name: [{ required: true, message: '请输入规则名称' }],
    description: [{ required: true, message: '请输入规则描述' }],
    matchPageRegexpPatterns: [
        {
            required: true,
            message: '请至少添加一个URL匹配模式',
            type: 'array',
        },
    ],
};

const formRef = ref();
const submitLoading = ref(false);

/**
 * 添加 URL 匹配模式
 */
function addMatchPattern() {
    formState.matchPageRegexpPatterns.push('');
}

/**
 * 删除 URL 匹配模式
 */
function removeMatchPattern(index: number) {
    formState.matchPageRegexpPatterns.splice(index, 1);
}

/**
 * 添加相关网站
 */
function addRelatedWebsite() {
    formState.relatedWebsites.push({
        title: '',
        description: '',
        urlPattern: '',
        url: '',
        icon: '',
        openInNewTab: true,
    });
}

/**
 * 删除相关网站
 */
function removeRelatedWebsite(index: number) {
    formState.relatedWebsites.splice(index, 1);
}

/**
 * 提交表单
 */
async function saveRule() {
    submitLoading.value = true;
    try {
        await formRef.value.validate();
        // 使用 sendMessage 将规则发送到后台
        const ruleData = toRaw(formState);
        await sendMessage('addRule', ruleData);
        message.success('规则保存成功');
    } catch (error) {
        console.error('表单验证失败:', error);
        message.error('请检查表单填写是否完整');

        // 滚动到第一个错误字段
        nextTick(() => {
            const firstErrorEl = document.querySelector('.ant-form-item-has-error');
            if (firstErrorEl) {
                firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    } finally {
        submitLoading.value = false;
    }
}
</script>

<template>
    <div class="flex h-screen flex-col overflow-auto">
        <div
            class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-8 py-4"
        >
            <h2 class="text-lg font-semibold">添加自定义规则</h2>
            <a-button type="primary" :loading="submitLoading" @click="saveRule">
                保存规则
            </a-button>
        </div>

        <div class="w-full flex-1 p-6">
            <a-form
                ref="formRef"
                :model="formState"
                :rules="rules"
                :label-col="labelCol"
                :wrapper-col="wrapperCol"
                class="mx-auto max-w-4xl"
                validate-trigger="submit"
            >
                <!-- 基本信息 -->
                <a-divider>基本信息</a-divider>

                <a-form-item label="规则类型" name="language">
                    <a-input v-model:value="formState.language" disabled />
                    <div class="text-sm text-gray-500">规则类型固定为 json</div>
                </a-form-item>

                <a-form-item label="规则名称" name="name">
                    <a-input
                        v-model:value="formState.name"
                        placeholder="例如: search-engine-redirect"
                    />
                    <div class="text-sm text-gray-500">为规则指定一个唯一的名称</div>
                </a-form-item>

                <a-form-item label="规则描述" name="description">
                    <a-textarea
                        v-model:value="formState.description"
                        placeholder="例如: Redirect searches from Baidu to other engines"
                        :rows="2"
                    />
                    <div class="text-sm text-gray-500">简要描述此规则的用途</div>
                </a-form-item>

                <!-- URL匹配模式 -->
                <a-divider>URL匹配模式</a-divider>
                <div class="mb-4 text-sm text-gray-500">
                    填写正则表达式来匹配页面URL，可以使用捕获组来提取URL中的参数
                </div>

                <a-form-item
                    v-if="formState.matchPageRegexpPatterns.length === 0"
                    label="URL匹配正则"
                >
                    <a-button type="dashed" @click="addMatchPattern">
                        <PlusOutlined /> 添加URL匹配模式
                    </a-button>
                </a-form-item>

                <template
                    v-for="(pattern, index) in formState.matchPageRegexpPatterns"
                    :key="index"
                >
                    <a-form-item
                        label="URL匹配正则"
                        :name="['matchPageRegexpPatterns', index]"
                        :rules="[{ required: true, message: '请输入URL匹配正则表达式' }]"
                    >
                        <a-input
                            v-model:value="formState.matchPageRegexpPatterns[index]"
                            placeholder="例如: https://www\.baidu\.com/s\?.*wd=([^&]+).*"
                        >
                            <template #addonAfter>
                                <a-button type="text" danger @click="removeMatchPattern(index)">
                                    <DeleteOutlined />
                                </a-button>
                            </template>
                        </a-input>
                        <div v-if="index === 0" class="text-sm text-gray-500">
                            使用正则表达式匹配页面URL。使用捕获组可以提取参数，稍后在URL模板中通过占位符引用。
                        </div>
                    </a-form-item>
                </template>

                <a-form-item
                    v-if="formState.matchPageRegexpPatterns.length > 0"
                    :wrapper-col="{ span: 18, offset: 6 }"
                >
                    <a-button type="dashed" block @click="addMatchPattern">
                        <PlusOutlined /> 添加URL匹配模式
                    </a-button>
                </a-form-item>

                <!-- 相关网站 -->
                <a-divider>相关网站</a-divider>
                <div class="mb-4 text-sm text-gray-500">添加当匹配到URL时要显示的相关网站</div>

                <div
                    v-for="(website, websiteIndex) in formState.relatedWebsites"
                    :key="websiteIndex"
                    class="mb-8 rounded-lg border p-4"
                >
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-md font-medium">相关网站 #{{ websiteIndex + 1 }}</h3>
                        <a-button
                            danger
                            :disabled="formState.relatedWebsites.length <= 1 && websiteIndex === 0"
                            @click="removeRelatedWebsite(websiteIndex)"
                        >
                            删除
                        </a-button>
                    </div>

                    <a-form-item
                        label="标题"
                        :name="['relatedWebsites', websiteIndex, 'title']"
                        :rules="[{ required: true, message: '请输入网站标题' }]"
                    >
                        <a-input
                            v-model:value="website.title"
                            placeholder="例如: Google Search (Same Query)"
                        />
                        <div class="text-sm text-gray-500">在弹窗中显示的网站名称</div>
                    </a-form-item>

                    <a-form-item
                        label="描述"
                        :name="['relatedWebsites', websiteIndex, 'description']"
                        :rules="[{ required: true, message: '请输入网站描述' }]"
                    >
                        <a-textarea
                            v-model:value="website.description"
                            placeholder="例如: View the same search query on Google"
                            :rows="1"
                        />
                        <div class="text-sm text-gray-500">对网站功能的简短描述</div>
                    </a-form-item>

                    <a-form-item
                        label="URL模板"
                        :name="['relatedWebsites', websiteIndex, 'urlPattern']"
                    >
                        <a-input
                            v-model:value="website.urlPattern"
                            placeholder="例如: https://www.google.com/search?q={urlParam:q}"
                        />
                        <div class="text-sm text-gray-500">
                            支持的占位符：<br />
                            - {urlParam:参数名} - 获取URL中的查询参数<br />
                            - {dom:选择器} - 获取页面DOM元素的内容
                        </div>
                    </a-form-item>

                    <a-form-item label="固定URL" :name="['relatedWebsites', websiteIndex, 'url']">
                        <a-input
                            v-model:value="website.url"
                            placeholder="例如: https://www.google.com/"
                        />
                        <div class="text-sm text-gray-500">
                            不带占位符的固定URL（与URL模板二选一）
                        </div>
                    </a-form-item>

                    <a-form-item label="图标URL" :name="['relatedWebsites', websiteIndex, 'icon']">
                        <a-input
                            v-model:value="website.icon"
                            placeholder="例如: https://www.google.com/favicon.ico"
                        />
                        <div class="text-sm text-gray-500">网站图标的URL地址</div>
                    </a-form-item>

                    <a-form-item
                        label="新标签页打开"
                        :name="['relatedWebsites', websiteIndex, 'openInNewTab']"
                    >
                        <a-switch v-model:checked="website.openInNewTab" />
                        <div class="text-sm text-gray-500">是否在新标签页中打开链接</div>
                    </a-form-item>
                </div>

                <a-form-item :wrapper-col="{ span: 24 }">
                    <a-button type="dashed" block @click="addRelatedWebsite">
                        <PlusOutlined /> 添加相关网站
                    </a-button>
                </a-form-item>
            </a-form>
        </div>
    </div>
</template>

<style scoped>
.ant-form-item {
    margin-bottom: 16px;
}

.ant-divider {
    margin: 24px 0 16px;
    font-weight: 500;
}
</style>
