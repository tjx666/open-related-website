<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { message } from 'ant-design-vue';
import { sendMessage } from 'webext-bridge/options';

import { RULES_PAGE_PATH } from '@/constants/path';

import { i18n } from '#i18n';

import RuleForm from '../../components/RuleForm.vue';

const router = useRouter();

/**
 * Submit form
 */
async function handleSubmit(formData: any) {
    await sendMessage('addRule', {
        language: 'json',
        isBuiltin: false,
        isEnabled: true,
        lastModifiedTimestamp: Date.now(),
        ...formData,
    });
    message.success(i18n.t('options.rules.add.ruleSavedSuccess'));
    // Return to the rules list page after saving successfully
    router.push(RULES_PAGE_PATH);
}
</script>

<template>
    <RuleForm
        :page-title="i18n.t('options.rules.add.addCustomRule')"
        :submit-button-text="i18n.t('options.rules.add.saveRule')"
        :on-submit="handleSubmit"
    />
</template>
