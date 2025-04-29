import { languages } from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

if (!globalThis.MonacoEnvironment) {
    globalThis.MonacoEnvironment = {
        getWorker(_: any, label: string) {
            if (label === 'json') {
                return new JsonWorker();
            }

            return new EditorWorker();
        },
    };

    // 配置 JSON 语言设置
    languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false, // 不允许 JSON 注释，因为我们先不支持 jsonc
        schemas: [], // 将在 RulesEditor.vue 中设置具体的 schema
    });
}
