import { createApp } from 'vue';

import { autoAnimatePlugin } from '@formkit/auto-animate/vue';

import type { ContentScriptContext } from '#imports';

import App from './Search.vue';

export function exit() {
    if (globalThis.__contentScriptUI__) {
        globalThis.__contentScriptUI__.remove();
        globalThis.__contentScriptUI__ = undefined;
    }
}

export async function openRelatedWebsite(ctx: ContentScriptContext) {
    const ui = await createShadowRootUi(ctx, {
        name: 'open-related-website',
        zIndex: 9999,
        position: 'modal',
        isolateEvents: true,
        onMount: (container) => {
            const app = createApp(App);
            app.use(autoAnimatePlugin).mount(container);
            return app;
        },
        onRemove: (app) => {
            app?.unmount();
        },
    });

    globalThis.__contentScriptUI__ = ui;
    ui.mount();
}

export async function toggleExtension(ctx: ContentScriptContext) {
    if (globalThis.__contentScriptUI__) {
        exit();
    } else {
        await openRelatedWebsite(ctx);
    }
}
