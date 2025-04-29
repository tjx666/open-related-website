<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { message } from 'ant-design-vue';
import { sendMessage } from 'webext-bridge/options';

import { RULES_PAGE_PATH } from '@/constants/path';

import { i18n } from '#i18n';

import RuleForm from '../../components/RuleForm.vue';

// Define rule form data interface
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
 * Get rule details
 */
async function loadRuleDetail() {
    try {
        loading.value = true;
        const allRules = await sendMessage('getRules', {});
        const rule = allRules.find((r) => r.name === ruleName);

        if (!rule) {
            message.error(i18n.t('options.rules.edit.ruleNotExist'));
            router.push(RULES_PAGE_PATH);
            return;
        }

        // Convert to form data
        initialFormData.value = rule as unknown as FormState;
    } catch (error) {
        console.error('Failed to get rule details:', error);
        message.error(i18n.t('options.rules.edit.failedToGetRuleDetails'));
        router.push(RULES_PAGE_PATH);
    } finally {
        loading.value = false;
    }
}

/**
 * Submit form
 */
async function handleSubmit(formData: FormState) {
    if (!initialFormData.value) return;

    // Use sendMessage to send the rule to the background
    await sendMessage('updateRule', {
        language: 'json',
        isBuiltin: (initialFormData.value as any).isBuiltin || false,
        isEnabled: (initialFormData.value as any).isEnabled || true,
        lastModifiedTimestamp: Date.now(),
        ...formData,
    });
    message.success(i18n.t('options.rules.edit.ruleUpdateSuccess'));
    // Return to the rules list page after successful save
    router.push(RULES_PAGE_PATH);
}

// Load rule details when component is mounted
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
        :page-title="i18n.t('options.rules.edit.editRule')"
        :submit-button-text="i18n.t('options.rules.edit.updateRule')"
        :initial-form-data="initialFormData"
        :on-submit="handleSubmit"
    />
</template>
