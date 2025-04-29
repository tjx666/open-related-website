<script lang="ts" setup>
import { h, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import { sendMessage } from 'webext-bridge/options';

import type { JsonRule, RuleItem } from '@/entrypoints/background/rules/BaseRule';

import { i18n } from '#i18n';

import { useRules } from '../../composables/useRules';
import { useStorage } from '../../composables/useStorage';

const router = useRouter();
const showBuiltinRules = useStorage<boolean>('showBuiltinRules', false);
const { rules: dataSource, refresh: refreshRules } = useRules(showBuiltinRules);
const loading = ref(false);

/**
 * Edit rule
 */
function editRule(ruleName: string) {
    router.push(`/rules/edit/${ruleName}`);
}

/**
 * Toggle rule enable status
 */
async function toggleRuleStatus(rule: RuleItem, enabled: boolean) {
    try {
        loading.value = true;
        await sendMessage('updateRule', {
            ...rule,
            isEnabled: enabled,
        } as JsonRule);
        message.success(
            i18n.t(
                enabled
                    ? 'options.rules.list.ruleEnabledSuccess'
                    : 'options.rules.list.ruleDisabledSuccess',
            ),
        );
        await refreshRules();
    } catch (error) {
        console.error('Failed to update rule status:', error);
        message.error(i18n.t('options.rules.list.updateRuleStatusFailed'));
    } finally {
        loading.value = false;
    }
}

/**
 * Delete rule
 */
function confirmDelete(ruleName: string) {
    Modal.confirm({
        title: i18n.t('options.rules.list.confirmDelete'),
        icon: () => h(ExclamationCircleOutlined),
        content: i18n.t('options.rules.list.deleteConfirmation'),
        okText: i18n.t('options.rules.list.delete'),
        okType: 'danger',
        cancelText: i18n.t('options.rules.list.cancel'),
        async onOk() {
            try {
                loading.value = true;
                await sendMessage('deleteRule', { name: ruleName });
                message.success(i18n.t('options.rules.list.ruleDeleteSuccess'));
                // Refresh rule list
                await refreshRules();
            } catch (error) {
                console.error('Failed to delete rule:', error);
                message.error(i18n.t('options.rules.list.deleteRuleFailed'));
            } finally {
                loading.value = false;
            }
        },
    });
}
</script>

<template>
    <div>
        <div class="flex h-16 items-center justify-between px-6 pl-3">
            <div class="flex items-center">
                <label class="flex items-center">
                    <a-switch v-model:checked="showBuiltinRules" />
                    <span class="ml-2">{{ i18n.t('options.rules.list.showBuiltinRules') }}</span>
                </label>
            </div>
            <router-link to="/rules/add">
                <a-button type="primary">{{ i18n.t('options.rules.list.addRule') }}</a-button>
            </router-link>
        </div>

        <a-table :data-source="dataSource" :loading="loading" row-key="name">
            <a-table-column
                key="name"
                :title="i18n.t('options.rules.list.ruleName')"
                data-index="name"
            />
            <a-table-column
                key="description"
                :title="i18n.t('options.rules.list.description')"
                data-index="description"
            />
            <a-table-column
                key="lastModifiedTimestamp"
                :title="i18n.t('options.rules.list.lastModifiedTime')"
            >
                <template #default="{ record }">
                    {{ new Date(record.lastModifiedTimestamp).toLocaleString() }}
                </template>
            </a-table-column>
            <a-table-column
                key="actions"
                :title="i18n.t('options.rules.list.actions')"
                align="center"
            >
                <template #default="{ record }">
                    <div class="flex justify-center space-x-3">
                        <a-button
                            type="link"
                            :disabled="record.isBuiltin"
                            class="edit-btn flex! items-center"
                            @click="editRule(record.name)"
                        >
                            <template #icon><EditOutlined /></template>
                            {{ i18n.t('options.rules.list.edit') }}
                        </a-button>
                        <a-button
                            type="link"
                            danger
                            :disabled="record.isBuiltin"
                            class="delete-btn flex! items-center"
                            @click="confirmDelete(record.name)"
                        >
                            <template #icon><DeleteOutlined /></template>
                            {{ i18n.t('options.rules.list.delete') }}
                        </a-button>
                    </div>
                </template>
            </a-table-column>
            <a-table-column
                key="isEnabled"
                :title="i18n.t('options.rules.list.enableStatus')"
                align="center"
                width="100px"
            >
                <template #default="{ record }">
                    <a-switch
                        v-model:checked="record.isEnabled"
                        :disabled="record.isBuiltin"
                        @change="(checked) => toggleRuleStatus(record, !!checked)"
                    />
                </template>
            </a-table-column>
            <template #emptyText>
                <div class="py-8 text-center text-gray-500">
                    <p>{{ i18n.t('options.rules.list.noRules') }}</p>
                    <router-link to="/rules/add" class="mt-4 block">
                        <a-button type="primary">{{
                            i18n.t('options.rules.list.addRule')
                        }}</a-button>
                    </router-link>
                </div>
            </template>
        </a-table>
    </div>
</template>

<style scoped>
@import '~/assets/tailwind.css';

.edit-btn {
    @apply text-blue-500;
}

.edit-btn[disabled] {
    @apply text-gray-400;
}
</style>
