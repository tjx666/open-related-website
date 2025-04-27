import type { RelatedWebsite } from 'webext-bridge';

import type { ResolveContext } from '../createResolveContext';

export interface BaseRule {
    language: string;
    name: string;
    description: string;
}

export abstract class JsRule implements BaseRule {
    public language = 'javascript';
    abstract name: string;
    abstract description: string;
    abstract matches: RegExp[];
    abstract resolve(context: ResolveContext): Promise<RelatedWebsite[]> | RelatedWebsite[];
}

export interface JsonRule extends BaseRule {
    language: 'json';
    name: string;
    description: string;
    matches: string[];
}
