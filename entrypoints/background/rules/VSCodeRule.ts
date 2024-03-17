import type { RelatedWebsite } from 'webext-bridge';

import type { ResolveContext } from '../createResolveContext';
import type { BaseRule } from './BaseRule';

export class VSCodeRule implements BaseRule {
    name = 'VSCode';
    description = 'Provide some local VSCode features';
    matches = [/https:\/\/github\.com\/.+\/.+/];

    resolve(context: ResolveContext): RelatedWebsite[] {
        return [
            {
                title: 'Clone in VSCode',
                name: 'cloneInVSCode',
                description: 'Clone the repo in local VSCode',
                url: `vscode://vscode.git/clone?url=https://github.com/`,
                icon: 'https://code.visualstudio.com/apple-touch-icon.png',
            },
            {
                title: 'Clone in VSCode Insiders',
                name: 'cloneInVSCodeInsiders',
                description: 'Clone the repo in local VSCode Insiders',
                url: `vscode-insiders://vscode.git/clone?url=https://github.com/`,
                icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Visual_Studio_Code_Insiders_1.36_icon.svg',
            },
        ].map((item) => {
            return {
                ...item,
                url: `${item.url}${context.repoPath}`,
                openInNewTab: false,
            };
        });
    }
}
