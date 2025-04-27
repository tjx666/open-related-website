<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { message } from 'ant-design-vue';
import { sendMessage } from 'webext-bridge/options';

import { RULES_PAGE_PATH } from '@/constants/path';

import RuleForm from '../../components/RuleForm.vue';

const router = useRouter();

/**
 * 提交表单
 */
async function handleSubmit(formData: any) {
    await sendMessage('addRule', {
        language: 'json',
        isBuiltin: false,
        isEnabled: true,
        lastModifiedTimestamp: Date.now(),
        ...formData,
    });
    message.success('规则保存成功');
    // 保存成功后返回规则列表页
    router.push(RULES_PAGE_PATH);
}
</script>

<template>
    <RuleForm page-title="添加自定义规则" submit-button-text="保存规则" :on-submit="handleSubmit" />
</template>
