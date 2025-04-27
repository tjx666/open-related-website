import { NpmPackageAnalysisRule } from './NpmPackageAnalysisRule';
import { RepoAnalysisRule } from './RepoAnalysisRule';
import { VSCodeRule } from './VSCodeRule';
import { WebIdeRule } from './WebIdeRule';

export const rules = [
    new WebIdeRule(),
    new RepoAnalysisRule(),
    new VSCodeRule(),
    new NpmPackageAnalysisRule(),
];
