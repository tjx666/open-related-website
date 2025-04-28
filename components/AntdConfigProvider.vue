<script setup lang="ts">
import { COLOR_PRIMARY } from '@/constants/ui';
</script>

<template>
    <a-config-provider :theme="{ token: { colorPrimary: COLOR_PRIMARY } }">
        <slot />
    </a-config-provider>
</template>
