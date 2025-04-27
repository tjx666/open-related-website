import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

globalThis.MonacoEnvironment = {
    getWorker(_: any, label: string) {
        if (label === 'json' || label === 'jsonc') {
            return new JsonWorker();
        }

        if (label === 'typescript' || label === 'javascript') {
            return new TsWorker();
        }

        return new EditorWorker();
    },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

// 配置 JSONC 语言设置
monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true, // 允许 JSON 注释
    schemas: [], // 将在 Add.vue 中设置具体的 schema
});
