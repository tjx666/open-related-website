<script lang="ts" setup>
import { h, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import { sendMessage } from 'webext-bridge/options';

import { useRules } from '../../composables/useRules';
import { useStorage } from '../../composables/useStorage';

const router = useRouter();
const showBuiltinRules = useStorage<boolean>('showBuiltinRules', false);
const dataSource = useRules(showBuiltinRules);
const loading = ref(false);

/**
 * 编辑规则
 */
function editRule(ruleName: string) {
    router.push(`/rules/edit/${ruleName}`);
}

/**
 * 刷新规则列表
 */
async function refreshRules() {
    loading.value = true;
    try {
        const allRules = await sendMessage('getRules', {});
        if (showBuiltinRules.value === false) {
            dataSource.value = allRules.filter((rule) => !rule.isBuiltin);
        } else {
            dataSource.value = allRules;
        }
    } finally {
        loading.value = false;
    }
}

/**
 * 删除规则
 */
function confirmDelete(ruleName: string) {
    Modal.confirm({
        title: '确认删除',
        icon: () => h(ExclamationCircleOutlined),
        content: '确定要删除这条规则吗？删除后将无法恢复。',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
            try {
                loading.value = true;
                await sendMessage('deleteRule', { name: ruleName });
                message.success('规则删除成功');
                // 刷新规则列表
                await refreshRules();
            } catch (error) {
                console.error('删除规则失败:', error);
                message.error('删除规则失败');
            } finally {
                loading.value = false;
            }
        },
    });
}
</script>

<template>
    <div>
        <div class="flex h-16 items-center justify-between px-6">
            <div class="flex items-center">
                <label class="flex items-center">
                    <a-switch v-model:checked="showBuiltinRules" />
                    <span class="ml-2">显示内置规则</span>
                </label>
            </div>
            <router-link to="/rules/add">
                <a-button type="primary">添加规则</a-button>
            </router-link>
        </div>

        <a-table :data-source="dataSource" :loading="loading" row-key="name">
            <a-table-column key="name" title="规则名称" data-index="name" />
            <a-table-column key="description" title="描述" data-index="description" />
            <a-table-column key="lastModifiedTimestamp" title="最后修改时间">
                <template #default="{ record }">
                    {{ new Date(record.lastModifiedTimestamp).toLocaleString() }}
                </template>
            </a-table-column>
            <a-table-column key="actions" title="操作" align="center">
                <template #default="{ record }">
                    <div class="flex justify-center space-x-3">
                        <a-button
                            type="link"
                            :disabled="record.isBuiltin"
                            class="edit-btn"
                            @click="editRule(record.name)"
                        >
                            <template #icon><EditOutlined /></template>
                            编辑
                        </a-button>
                        <a-button
                            type="link"
                            danger
                            :disabled="record.isBuiltin"
                            class="delete-btn"
                            @click="confirmDelete(record.name)"
                        >
                            <template #icon><DeleteOutlined /></template>
                            删除
                        </a-button>
                    </div>
                </template>
            </a-table-column>
            <template #emptyText>
                <div class="py-8 text-center text-gray-500">
                    <p>暂无规则</p>
                    <router-link to="/rules/add" class="mt-4 block">
                        <a-button type="primary">添加规则</a-button>
                    </router-link>
                </div>
            </template>
        </a-table>
    </div>
</template>

<style scoped>
.edit-btn {
    @apply text-blue-500;
}

.edit-btn[disabled] {
    @apply text-gray-400;
}
</style>
