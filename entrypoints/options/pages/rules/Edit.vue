<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { message } from 'ant-design-vue';
import { sendMessage } from 'webext-bridge/options';

import { RULES_PAGE_PATH } from '@/constants/path';

import RuleForm from '../../components/RuleForm.vue';

// 定义规则表单数据接口
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
    }>;
}

const route = useRoute();
const router = useRouter();
const ruleName = route.params.name as string;
const initialFormData = ref<FormState | null>(null);
const loading = ref(true);

/**
 * 获取规则详情
 */
async function loadRuleDetail() {
    try {
        loading.value = true;
        const allRules = await sendMessage('getRules', {});
        const rule = allRules.find((r) => r.name === ruleName);

        if (!rule) {
            message.error('规则不存在');
            router.push(RULES_PAGE_PATH);
            return;
        }

        // 转换成表单数据
        initialFormData.value = rule as unknown as FormState;
    } catch (error) {
        console.error('获取规则详情失败:', error);
        message.error('获取规则详情失败');
        router.push(RULES_PAGE_PATH);
    } finally {
        loading.value = false;
    }
}

/**
 * 提交表单
 */
async function handleSubmit(formData: FormState) {
    if (!initialFormData.value) return;

    // 使用 sendMessage 将规则发送到后台
    await sendMessage('updateRule', {
        language: 'json',
        isBuiltin: (initialFormData.value as any).isBuiltin || false,
        isEnabled: (initialFormData.value as any).isEnabled || true,
        lastModifiedTimestamp: Date.now(),
        ...formData,
    });
    message.success('规则更新成功');
    // 保存成功后返回规则列表页
    router.push(RULES_PAGE_PATH);
}

// 组件挂载时加载规则详情
onMounted(() => {
    loadRuleDetail();
});
</script>

<template>
    <div v-if="loading" class="flex h-screen items-center justify-center">
        <a-spin size="large" />
    </div>
    <RuleForm
        v-else-if="initialFormData"
        page-title="编辑规则"
        submit-button-text="更新规则"
        :initial-form-data="initialFormData"
        :on-submit="handleSubmit"
    />
</template>
