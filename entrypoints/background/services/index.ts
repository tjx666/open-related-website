import { getRelatedWebsites } from './getRelatedWebsites';
import { parseWebsites } from './parseWebsites';
import { registerRulesServices } from './registerRulesServices';

export async function registerServices() {
    getRelatedWebsites();
    registerRulesServices();
    parseWebsites();
}
