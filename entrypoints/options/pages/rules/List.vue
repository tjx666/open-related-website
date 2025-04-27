<script lang="ts" setup>
import { ref } from 'vue';

import { useRules } from '../../composables/useRules';
import { useStorage } from '../../composables/useStorage';

const showBuiltinRules = useStorage<boolean>('showBuiltinRules', false);
const dataSource = useRules(showBuiltinRules);

const showModel = ref(false);
</script>

<template>
    <div>
        <div class="flex h-16 items-center px-2">
            <label>
                <a-switch v-model:checked="showBuiltinRules" />
                <span>Show builtin</span>
            </label>
            <router-link to="/rules/add">
                <a-button class="ml-4" type="primary" @click="showModel = true">Add Rule</a-button>
            </router-link>
        </div>

        <a-table :data-source>
            <a-table-column-group>
                <a-table-column key="name" title="Name" data-index="name" />
                <a-table-column key="description" title="Description" data-index="description" />
            </a-table-column-group>
        </a-table>
    </div>
</template>

<style scoped>
@reference '~/assets/tailwind.css';

label {
    @apply flex w-fit items-center justify-center;

    button {
        @apply mr-2;
    }
}
</style>
