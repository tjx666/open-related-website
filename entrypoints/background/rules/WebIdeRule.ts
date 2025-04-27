import { omit } from 'lodash-es';
import type { RelatedWebsite } from 'webext-bridge';

import type { ResolveContext } from '../createResolveContext';
import { JsRule } from './BaseRule';

interface IdeWebsite {
    title: string;
    name: string;
    description: string;
    url: string;
    platforms: string[];
    openInNewTab?: boolean;
    icon: string;
}

export class WebIdeRule extends JsRule {
    name = 'Web IDE';
    description = 'Import the repository in web IDE';
    matchPageRegexes = [/https:\/\/(github|gitlab)\.com\/.+\/.+/];

    resolve(context: ResolveContext): RelatedWebsite[] {
        const platform = context.host.split('.')[0];
        const ideWebsitesList: IdeWebsite[] = [
            {
                title: 'StackBlitz',
                name: 'stackBlitz',
                description: 'Import repository in StackBlitz',
                url: 'https://githubblitz.com/',
                platforms: ['github'],
                icon: 'https://stackblitz.com/_astro/favicon.svg',
            },
            {
                title: 'CodeSandbox',
                name: 'codeSandbox',
                description: 'Import repository in CodeSandbox',
                url: `https://codesandbox.io/s/${platform}/`,
                platforms: ['github'],
                icon: 'https://codesandbox.io/codesandbox-16.png',
            },
            {
                title: 'Sourcegraph',
                name: 'sourcegraph',
                description: 'Allows developers to rapidly search, write, and understand code',
                url: `https://sourcegraph.com/${platform}.com/`,
                platforms: ['github', 'gitlab'],
                icon: 'https://sourcegraph.com/favicon.ico',
            },
        ];

        return ideWebsitesList
            .filter((ide) => ide.platforms.includes(platform))
            .map((ide) => {
                return {
                    ...omit(ide, 'platform'),
                    url: `${ide.url}${context.repoPath}`,
                    openInNewTab: true,
                };
            });
    }
}
