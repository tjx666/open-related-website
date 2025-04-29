<script lang="ts" setup>
import type { UnwrapRef } from 'vue';
import { nextTick, onMounted, reactive, ref, toRaw } from 'vue';
import { useRouter } from 'vue-router';

import {
    ArrowLeftOutlined,
    DeleteOutlined,
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';
import { sendMessage } from 'webext-bridge/options';

import { RULES_PAGE_PATH } from '@/constants/path';

// 表单数据接口
interface FormState {
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
        level: number;
    }>;
}

const props = defineProps<{
    pageTitle: string;
    submitButtonText: string;
    initialFormData?: FormState;
    onSubmit: (formData: any) => Promise<void>;
}>();

// 路由
const router = useRouter();

// 表单数据
const formState: UnwrapRef<FormState> = reactive(
    props.initialFormData || {
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
                level: 0,
            },
        ],
    },
);

// 表单布局
const labelCol = { span: 6 };
const wrapperCol = { span: 18 };

// 已存在的规则名称列表
const existingRuleNames = ref<string[]>([]);

/**
 * 获取所有规则名称
 */
async function loadExistingRuleNames() {
    try {
        const allRules = await sendMessage('getRules', {});
        existingRuleNames.value = allRules.map((rule) => rule.name);
    } catch (error) {
        console.error('获取规则列表失败:', error);
    }
}

/**
 * 检查规则名称是否已存在
 */
function validateRuleName(value: string) {
    // 如果是编辑模式且名称没变，则允许通过
    if (props.initialFormData && props.initialFormData.name === value) {
        return true;
    }
    return !existingRuleNames.value.includes(value);
}

/**
 * 验证图标 URL 是否有效
 */
async function validateIconUrl(_rule: Rule, value: string) {
    if (!value) return;

    return new Promise<void>((resolve, reject) => {
        const img = document.createElement('img');
        img.addEventListener('load', () => resolve());
        img.addEventListener('error', () => reject('图标加载失败，请检查URL是否正确'));
        img.src = value;
    });
}

// 表单验证规则
const rules: Record<string, Rule[]> = {
    name: [
        { required: true, message: '请输入规则名称' },
        {
            validator: (rule: Rule, value: string) => {
                if (!validateRuleName(value)) {
                    return Promise.reject('规则名称已存在，请使用其他名称');
                }
                return Promise.resolve();
            },
        },
    ],
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

// 添加解析网站信息的方法
const parsingWebsite = ref(false);

/**
 * 解析网站信息
 */
async function parseWebsiteInfo(index: number, urlType: 'url' | 'urlPattern') {
    const website = formState.relatedWebsites[index];
    const urlValue = urlType === 'url' ? website.url : website.urlPattern;

    if (!urlValue) {
        message.warning('请先输入URL');
        return;
    }

    try {
        parsingWebsite.value = true;

        // 提取域名部分
        let domainUrl = urlValue;

        // 处理占位符：移除所有 {xxx} 格式的占位符
        domainUrl = domainUrl.replaceAll(/\{[^}]+\}/g, '');

        // 尝试创建 URL 对象并获取域名
        try {
            // 确保 URL 有协议前缀
            if (!domainUrl.startsWith('http://') && !domainUrl.startsWith('https://')) {
                domainUrl = `https://${domainUrl}`;
            }

            const urlObj = new URL(domainUrl);
            // 只使用域名部分构建 URL
            domainUrl = urlObj.port
                ? `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}`
                : `${urlObj.protocol}//${urlObj.hostname}`;
        } catch (error) {
            // URL 解析失败，使用原始输入
            console.error('URL解析失败:', error);
        }

        // 发送消息到后台解析网站信息
        const info = await sendMessage('parseWebsites', { url: domainUrl });

        // 更新表单数据
        if (info) {
            website.title = website.title || info.title;
            website.description = website.description || info.description;
            website.icon = website.icon || info.iconUrl;

            message.success('网站信息解析成功');
        } else {
            message.warning('无法获取网站信息');
        }
    } catch (error) {
        console.error('解析网站失败:', error);
        message.error('解析网站失败，请检查URL是否有效');
    } finally {
        parsingWebsite.value = false;
    }
}

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
        level: 0,
    });
}

/**
 * 删除相关网站
 */
function removeRelatedWebsite(index: number) {
    formState.relatedWebsites.splice(index, 1);
}

/**
 * 自定义 URL 验证：确保 URL 模板和固定 URL 至少填写一个
 */
function validateUrl(rule: any, value: string, callback: (error?: string) => void) {
    const fieldPath = rule.field as string;
    const index = Number.parseInt(fieldPath.match(/\d+/)?.[0] || '0');
    const website = formState.relatedWebsites[index];

    if (!website.urlPattern && !website.url) {
        callback('URL模板和固定URL必须至少填写一个');
    } else {
        callback();
    }
}

/**
 * 提交表单
 */
async function handleSubmit() {
    submitLoading.value = true;
    try {
        await formRef.value.validate();
        const ruleData = toRaw(formState);
        await props.onSubmit(ruleData);
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

/**
 * 返回规则列表页
 */
function goBack() {
    router.push(RULES_PAGE_PATH);
}

/**
 * 打开 Regex101 测试正则表达式
 */
function openRegex101(pattern: string) {
    if (!pattern) {
        message.info('请先输入正则表达式');
        return;
    }

    // 构建测试字符串，使用一些常见的 URL 样例
    const testString = `
https://github.com/user/repo
https://github.com/user/repo/tree/main
https://gitlab.com/user/project
https://www.npmjs.com/package/vue
https://www.google.com/search?q=regex101
https://stackoverflow.com/questions/tagged/javascript
https://www.baidu.com/s?wd=正则表达式
https://cn.bing.com/search?q=URL+pattern
https://example.com/path/to/resource?param1=value1&param2=value2
`;

    // 直接使用输入的正则表达式，默认添加忽略大小写的 flag
    const regex = pattern;
    const flags = 'i';

    // 构建 Regex101 URL
    const url = `https://regex101.com/?regex=${encodeURIComponent(regex)}&flavor=javascript&flags=${flags}&testString=${encodeURIComponent(testString)}`;

    // 在新标签页中打开
    window.open(url, '_blank');
}

// 组件挂载时加载规则列表
onMounted(() => {
    loadExistingRuleNames();
});
</script>

<template>
    <div class="flex h-screen flex-col overflow-auto">
        <div
            class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-8 py-4 pl-2"
        >
            <div class="flex items-center">
                <a-button
                    type="text"
                    class="back-btn flex items-center justify-center"
                    @click="goBack"
                >
                    <template #icon><ArrowLeftOutlined /></template>
                </a-button>
                <h2 class="ml-2 text-lg font-semibold">{{ pageTitle }}</h2>
            </div>
            <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
                {{ submitButtonText }}
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
                                <div class="flex gap-1">
                                    <a-button
                                        type="link"
                                        class="px-1"
                                        title="在 Regex101 测试"
                                        @click="
                                            openRegex101(formState.matchPageRegexpPatterns[index])
                                        "
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <path
                                                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                                            ></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                        </svg>
                                    </a-button>
                                    <a-button type="text" danger @click="removeMatchPattern(index)">
                                        <DeleteOutlined />
                                    </a-button>
                                </div>
                            </template>
                        </a-input>
                        <div v-if="index === 0" class="text-sm text-gray-500">
                            使用正则表达式匹配页面URL，匹配成功就会推荐下面配置的相关网站。
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
                        label="URL模板"
                        :name="['relatedWebsites', websiteIndex, 'urlPattern']"
                        :rules="[
                            { validator: validateUrl, message: 'URL模板和固定URL必须至少填写一个' },
                        ]"
                    >
                        <div class="flex gap-2">
                            <a-input
                                v-model:value="website.urlPattern"
                                placeholder="例如: https://www.google.com/search?q={urlParam:q}"
                            />
                            <a-button
                                type="primary"
                                title="自动获取网站信息（标题、描述和图标）"
                                :loading="parsingWebsite"
                                :disabled="!website.urlPattern"
                                @click="parseWebsiteInfo(websiteIndex, 'urlPattern')"
                            >
                                <template #icon><SearchOutlined /></template>
                            </a-button>
                        </div>
                        <div class="text-sm text-gray-500">
                            支持的占位符：<br />
                            - {urlParam:参数名} - 获取URL中的查询参数<br />
                            - {urlPathSegment:索引} - 获取URL
                            path中的片段（按/分割，0为第一个；不带索引则返回完整path）<br />
                            - {dom:选择器} - 获取页面DOM元素的内容<br />
                            - {repoPath} - 获取当前页面的仓库路径（仅在GitHub/GitLab等平台上可用）
                        </div>
                    </a-form-item>

                    <a-form-item
                        label="固定URL"
                        :name="['relatedWebsites', websiteIndex, 'url']"
                        :rules="[
                            { validator: validateUrl, message: 'URL模板和固定URL必须至少填写一个' },
                        ]"
                    >
                        <div class="flex gap-2">
                            <a-input
                                v-model:value="website.url"
                                placeholder="例如: https://www.google.com/"
                            />
                            <a-button
                                type="primary"
                                title="自动获取网站信息（标题、描述和图标）"
                                :loading="parsingWebsite"
                                :disabled="!website.url"
                                @click="parseWebsiteInfo(websiteIndex, 'url')"
                            >
                                <template #icon><SearchOutlined /></template>
                            </a-button>
                        </div>
                        <div class="text-sm text-gray-500">
                            不支持占位符的固定URL（与URL模板二选一）
                        </div>
                    </a-form-item>

                    <a-form-item
                        label="标题"
                        :name="['relatedWebsites', websiteIndex, 'title']"
                        :rules="[{ required: true, message: '请输入网站标题' }]"
                    >
                        <a-input
                            v-model:value="website.title"
                            placeholder="例如: Google Search (Same Query)"
                        />
                        <div class="text-sm text-gray-500">在推荐列表中显示的网站标题</div>
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
                        label="图标URL"
                        :name="['relatedWebsites', websiteIndex, 'icon']"
                        validate-trigger="change"
                        :rules="[{ validator: validateIconUrl }]"
                    >
                        <div class="flex items-center gap-2">
                            <a-input
                                v-model:value="website.icon"
                                placeholder="例如: https://www.google.com/favicon.ico"
                            />
                            <div
                                v-if="website.icon"
                                class="flex h-8 w-8 items-center justify-center rounded border"
                            >
                                <img
                                    :src="website.icon"
                                    class="h-4 w-4 object-contain"
                                    alt="Website Icon"
                                />
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">
                            网站图标的URL地址，建议使用 16x16 或 32x32 的图标
                        </div>
                    </a-form-item>

                    <a-form-item
                        label="新标签页打开"
                        :name="['relatedWebsites', websiteIndex, 'openInNewTab']"
                    >
                        <a-switch v-model:checked="website.openInNewTab" />
                        <div class="text-sm text-gray-500">是否在新标签页中打开链接</div>
                    </a-form-item>

                    <a-form-item
                        label="推荐级别"
                        :name="['relatedWebsites', websiteIndex, 'level']"
                    >
                        <a-input-number
                            v-model:value="website.level"
                            :min="0"
                            :max="100"
                            placeholder="0"
                        />
                        <div class="text-sm text-gray-500">
                            级别越高在推荐列表中排序越靠前（当相似度相同时）
                        </div>
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

.back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    width: 32px;
    padding: 0;
}
</style>
