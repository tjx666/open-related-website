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

import { i18n } from '#i18n';

import ExternalLinkIcon from '@/components/icons/ExternalLinkIcon.vue';

// Form data interface
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

// Router
const router = useRouter();

// Form data
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

// Form layout
const labelCol = { span: 6 };
const wrapperCol = { span: 18 };

// List of existing rule names
const existingRuleNames = ref<string[]>([]);

/**
 * Get all rule names
 */
async function loadExistingRuleNames() {
    try {
        const allRules = await sendMessage('getRules', {});
        existingRuleNames.value = allRules.map((rule) => rule.name);
    } catch (error) {
        console.error('Failed to get rule list:', error);
    }
}

/**
 * Check if the rule name already exists
 */
function validateRuleName(value: string) {
    // If in edit mode and the name hasn't changed, allow it to pass
    if (props.initialFormData && props.initialFormData.name === value) {
        return true;
    }
    return !existingRuleNames.value.includes(value);
}

/**
 * Validate if the icon URL is valid
 */
async function validateIconUrl(_rule: Rule, value: string) {
    if (!value) return;

    return new Promise<void>((resolve, reject) => {
        const img = document.createElement('img');
        img.addEventListener('load', () => resolve());
        img.addEventListener('error', () => reject(i18n.t('options.rules.form.iconLoadFailed')));
        img.src = value;
    });
}

// Form validation rules
const rules: Record<string, Rule[]> = {
    name: [
        { required: true, message: i18n.t('options.rules.form.nameRequired') },
        {
            validator: (rule: Rule, value: string) => {
                if (!validateRuleName(value)) {
                    return Promise.reject(i18n.t('options.rules.form.nameExists'));
                }
                return Promise.resolve();
            },
        },
    ],
    description: [{ required: true, message: i18n.t('options.rules.form.descriptionRequired') }],
    matchPageRegexpPatterns: [
        {
            required: true,
            message: i18n.t('options.rules.form.patternRequired'),
            type: 'array',
        },
    ],
};

const formRef = ref();
const submitLoading = ref(false);

// Add method for parsing website information
const parsingWebsite = ref(false);

/**
 * Parse website information
 */
async function parseWebsiteInfo(index: number, urlType: 'url' | 'urlPattern') {
    const website = formState.relatedWebsites[index];
    const urlValue = urlType === 'url' ? website.url : website.urlPattern;

    if (!urlValue) {
        message.warning(i18n.t('options.rules.form.enterUrlFirst'));
        return;
    }

    try {
        parsingWebsite.value = true;

        // Extract domain part
        let domainUrl = urlValue;

        // Handle placeholders: remove all placeholders in {xxx} format
        domainUrl = domainUrl.replaceAll(/\{[^}]+\}/g, '');

        // Try to create URL object and get domain
        try {
            // Ensure URL has protocol prefix
            if (!domainUrl.startsWith('http://') && !domainUrl.startsWith('https://')) {
                domainUrl = `https://${domainUrl}`;
            }

            const urlObj = new URL(domainUrl);
            // Use only domain part to build URL
            domainUrl = urlObj.port
                ? `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}`
                : `${urlObj.protocol}//${urlObj.hostname}`;
        } catch (error) {
            // URL parsing failed, use original input
            console.error('URL parsing failed:', error);
        }

        // Send message to background to parse website information
        const info = await sendMessage('parseWebsites', { url: domainUrl });

        // Update form data
        if (info) {
            website.title = website.title || info.title;
            website.description = website.description || info.description;
            website.icon = website.icon || info.iconUrl;

            message.success(i18n.t('options.rules.form.parseSuccess'));
        } else {
            message.warning(i18n.t('options.rules.form.parseFailed'));
        }
    } catch (error) {
        console.error('Failed to parse website:', error);
        message.error(i18n.t('options.rules.form.parseError'));
    } finally {
        parsingWebsite.value = false;
    }
}

/**
 * Add URL match pattern
 */
function addMatchPattern() {
    formState.matchPageRegexpPatterns.push('');
}

/**
 * Remove URL match pattern
 */
function removeMatchPattern(index: number) {
    formState.matchPageRegexpPatterns.splice(index, 1);
}

/**
 * Add related website
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
 * Remove related website
 */
function removeRelatedWebsite(index: number) {
    formState.relatedWebsites.splice(index, 1);
}

/**
 * Custom URL validation: Ensure at least one of URL template and fixed URL is filled
 */
function validateUrl(rule: any, value: string, callback: (error?: string) => void) {
    const fieldPath = rule.field as string;
    const index = Number.parseInt(fieldPath.match(/\d+/)?.[0] || '0');
    const website = formState.relatedWebsites[index];

    if (!website.urlPattern && !website.url) {
        callback(i18n.t('options.rules.form.urlOrPatternRequired'));
    } else {
        callback();
    }
}

/**
 * Submit form
 */
async function handleSubmit() {
    submitLoading.value = true;
    try {
        await formRef.value.validate();
        const ruleData = toRaw(formState);
        await props.onSubmit(ruleData);
    } catch (error) {
        console.error('Form validation failed:', error);
        message.error(i18n.t('options.rules.form.validationFailed'));

        // Scroll to the first error field
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
 * Return to rule list page
 */
function goBack() {
    router.push(RULES_PAGE_PATH);
}

/**
 * Open Regex101 to test regular expression
 */
function openRegex101(pattern: string) {
    if (!pattern) {
        message.info(i18n.t('options.rules.form.enterRegexFirst'));
        return;
    }

    // Build test string using common URL examples
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

    // Use the input regular expression directly, default to add case-insensitive flag
    const regex = pattern;
    const flags = 'i';

    // Build Regex101 URL
    const url = `https://regex101.com/?regex=${encodeURIComponent(regex)}&flavor=javascript&flags=${flags}&testString=${encodeURIComponent(testString)}`;

    // Open in new tab
    window.open(url, '_blank');
}

// Load rule list when component is mounted
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
                <a-divider>{{ i18n.t('options.rules.form.basicInfo') }}</a-divider>

                <a-form-item :label="i18n.t('options.rules.form.ruleName')" name="name">
                    <a-input
                        v-model:value="formState.name"
                        :placeholder="i18n.t('options.rules.form.ruleNamePlaceholder')"
                    />
                    <div class="text-sm text-gray-500">
                        {{ i18n.t('options.rules.form.ruleNameTip') }}
                    </div>
                </a-form-item>

                <a-form-item :label="i18n.t('options.rules.form.description')" name="description">
                    <a-textarea
                        v-model:value="formState.description"
                        :placeholder="i18n.t('options.rules.form.descriptionPlaceholder')"
                        :rows="2"
                    />
                    <div class="text-sm text-gray-500">
                        {{ i18n.t('options.rules.form.descriptionTip') }}
                    </div>
                </a-form-item>

                <a-form-item
                    v-if="formState.matchPageRegexpPatterns.length === 0"
                    :label="i18n.t('options.rules.form.urlMatchRegex')"
                >
                    <a-button class="flex! items-center" type="dashed" @click="addMatchPattern">
                        <PlusOutlined /> {{ i18n.t('options.rules.form.addUrlPattern') }}
                    </a-button>
                </a-form-item>

                <template
                    v-for="(pattern, index) in formState.matchPageRegexpPatterns"
                    :key="index"
                >
                    <a-form-item
                        :label="
                            formState.matchPageRegexpPatterns.length > 1
                                ? `${i18n.t('options.rules.form.urlMatchRegex')} ${index + 1}`
                                : i18n.t('options.rules.form.urlMatchRegex')
                        "
                        :name="['matchPageRegexpPatterns', index]"
                        :rules="[
                            { required: true, message: i18n.t('options.rules.form.regexRequired') },
                        ]"
                    >
                        <a-input
                            v-model:value="formState.matchPageRegexpPatterns[index]"
                            :placeholder="i18n.t('options.rules.form.regexPlaceholder')"
                        >
                            <template #addonAfter>
                                <div class="flex gap-1">
                                    <a-button
                                        type="link"
                                        class="px-1"
                                        :title="i18n.t('options.rules.form.testOnRegex101')"
                                        @click="
                                            openRegex101(formState.matchPageRegexpPatterns[index])
                                        "
                                    >
                                        <ExternalLinkIcon />
                                    </a-button>
                                    <a-button type="text" danger @click="removeMatchPattern(index)">
                                        <DeleteOutlined />
                                    </a-button>
                                </div>
                            </template>
                        </a-input>
                        <div v-if="index === 0" class="text-sm text-gray-500">
                            {{ i18n.t('options.rules.form.regexTip') }}
                        </div>
                    </a-form-item>
                </template>

                <a-form-item
                    v-if="formState.matchPageRegexpPatterns.length > 0"
                    :wrapper-col="{ span: 18, offset: 6 }"
                >
                    <a-button type="dashed" block @click="addMatchPattern">
                        <PlusOutlined /> {{ i18n.t('options.rules.form.addUrlPattern') }}
                    </a-button>
                </a-form-item>

                <!-- 相关网站 -->
                <a-divider>{{ i18n.t('options.rules.form.relatedWebsites') }}</a-divider>
                <div class="mb-4 text-sm text-gray-500">
                    {{ i18n.t('options.rules.form.relatedWebsitesTip') }}
                </div>

                <div
                    v-for="(website, websiteIndex) in formState.relatedWebsites"
                    :key="websiteIndex"
                    class="mb-8 rounded-lg border p-4"
                >
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-md font-medium">
                            {{ i18n.t('options.rules.form.relatedWebsite') }} #{{
                                websiteIndex + 1
                            }}
                        </h3>
                        <a-button
                            danger
                            :disabled="formState.relatedWebsites.length <= 1 && websiteIndex === 0"
                            @click="removeRelatedWebsite(websiteIndex)"
                        >
                            {{ i18n.t('options.rules.form.delete') }}
                        </a-button>
                    </div>

                    <a-form-item
                        :label="i18n.t('options.rules.form.urlPattern')"
                        :name="['relatedWebsites', websiteIndex, 'urlPattern']"
                        :rules="[
                            {
                                validator: validateUrl,
                                message: i18n.t('options.rules.form.urlOrPatternRequired'),
                            },
                        ]"
                    >
                        <div class="flex gap-2">
                            <a-input
                                v-model:value="website.urlPattern"
                                :placeholder="i18n.t('options.rules.form.urlPatternPlaceholder')"
                            />
                            <a-button
                                type="primary"
                                :title="i18n.t('options.rules.form.parseWebsiteInfoTitle')"
                                :loading="parsingWebsite"
                                :disabled="!website.urlPattern"
                                @click="parseWebsiteInfo(websiteIndex, 'urlPattern')"
                            >
                                <template #icon><SearchOutlined /></template>
                            </a-button>
                        </div>
                        <div class="text-sm text-gray-500">
                            <div>
                                {{ i18n.t('options.rules.form.urlPatternTip').split('- ')[0] }}
                            </div>
                            <ul class="ml-5 list-disc">
                                <li
                                    v-for="(item, index) in i18n
                                        .t('options.rules.form.urlPatternTip')
                                        .split('- ')
                                        .slice(1)"
                                    :key="index"
                                >
                                    {{ item }}
                                </li>
                            </ul>
                        </div>
                    </a-form-item>

                    <a-form-item
                        :label="i18n.t('options.rules.form.fixedUrl')"
                        :name="['relatedWebsites', websiteIndex, 'url']"
                        :rules="[
                            {
                                validator: validateUrl,
                                message: i18n.t('options.rules.form.urlOrPatternRequired'),
                            },
                        ]"
                    >
                        <div class="flex gap-2">
                            <a-input
                                v-model:value="website.url"
                                :placeholder="i18n.t('options.rules.form.fixedUrlPlaceholder')"
                            />
                            <a-button
                                type="primary"
                                :title="i18n.t('options.rules.form.parseWebsiteInfoTitle')"
                                :loading="parsingWebsite"
                                :disabled="!website.url"
                                @click="parseWebsiteInfo(websiteIndex, 'url')"
                            >
                                <template #icon><SearchOutlined /></template>
                            </a-button>
                        </div>
                        <div class="text-sm text-gray-500">
                            {{ i18n.t('options.rules.form.fixedUrlTip') }}
                        </div>
                    </a-form-item>

                    <a-form-item
                        :label="i18n.t('options.rules.form.websiteTitle')"
                        :name="['relatedWebsites', websiteIndex, 'title']"
                        :rules="[
                            {
                                required: true,
                                message: i18n.t('options.rules.form.websiteTitleRequired'),
                            },
                        ]"
                    >
                        <a-input
                            v-model:value="website.title"
                            :placeholder="i18n.t('options.rules.form.websiteTitlePlaceholder')"
                        />
                        <div class="text-sm text-gray-500">
                            {{ i18n.t('options.rules.form.websiteTitleTip') }}
                        </div>
                    </a-form-item>

                    <a-form-item
                        :label="i18n.t('options.rules.form.websiteDescription')"
                        :name="['relatedWebsites', websiteIndex, 'description']"
                        :rules="[
                            {
                                required: true,
                                message: i18n.t('options.rules.form.websiteDescriptionRequired'),
                            },
                        ]"
                    >
                        <a-textarea
                            v-model:value="website.description"
                            :placeholder="
                                i18n.t('options.rules.form.websiteDescriptionPlaceholder')
                            "
                            :rows="1"
                        />
                        <div class="text-sm text-gray-500">
                            {{ i18n.t('options.rules.form.websiteDescriptionTip') }}
                        </div>
                    </a-form-item>

                    <a-form-item
                        :label="i18n.t('options.rules.form.iconUrl')"
                        :name="['relatedWebsites', websiteIndex, 'icon']"
                        validate-trigger="change"
                        :rules="[{ validator: validateIconUrl }]"
                    >
                        <div class="flex items-center gap-2">
                            <a-input
                                v-model:value="website.icon"
                                :placeholder="i18n.t('options.rules.form.iconUrlPlaceholder')"
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
                            {{ i18n.t('options.rules.form.iconUrlTip') }}
                        </div>
                    </a-form-item>

                    <a-form-item
                        :label="i18n.t('options.rules.form.openInNewTab')"
                        :name="['relatedWebsites', websiteIndex, 'openInNewTab']"
                    >
                        <a-switch v-model:checked="website.openInNewTab" />
                        <div class="text-sm text-gray-500">
                            {{ i18n.t('options.rules.form.openInNewTabTip') }}
                        </div>
                    </a-form-item>

                    <a-form-item
                        :label="i18n.t('options.rules.form.recommendationLevel')"
                        :name="['relatedWebsites', websiteIndex, 'level']"
                    >
                        <a-input-number
                            v-model:value="website.level"
                            :min="0"
                            :max="100"
                            :placeholder="i18n.t('options.rules.form.levelPlaceholder')"
                        />
                        <div class="text-sm text-gray-500">
                            {{ i18n.t('options.rules.form.levelTip') }}
                        </div>
                    </a-form-item>
                </div>

                <a-form-item :wrapper-col="{ span: 24 }">
                    <a-button type="dashed" block @click="addRelatedWebsite">
                        <PlusOutlined /> {{ i18n.t('options.rules.form.addRelatedWebsite') }}
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
