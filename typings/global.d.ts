declare module globalThis {
    import type { ShadowRootContentScriptUi } from '#imports';
    import type { App } from 'vue';
    import type { Environment } from 'monaco-editor';

    var MonacoEnvironment: Environment | undefined;
    var __contentScriptUI__: ShadowRootContentScriptUi<App<Element>> | undefined;
}
