import { getRelatedWebsites } from './getRelatedWebsites';
import { registerRulesServices } from './registerRulesServices';

export async function registerServices() {
    getRelatedWebsites();
    registerRulesServices();
}
