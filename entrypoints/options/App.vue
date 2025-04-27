<template>
    <a-config-provider
        :theme="{
            token: {
                colorPrimary: '#467ee7',
            },
        }"
    >
        <a-layout class="h-screen overflow-y-scroll bg-white">
            <a-layout-sider class="bg-white!">
                <a-menu>
                    <a-menu-item key="rules">
                        <router-link to="/rules">rules</router-link>
                    </a-menu-item>
                </a-menu>
            </a-layout-sider>
            <a-layout-content><router-view /> </a-layout-content>
        </a-layout>
    </a-config-provider>
</template>
