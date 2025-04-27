import '~/assets/tailwind.css';

import { toggleExtension } from './toggleExtension';
import { onCommand } from './utils/message';

export default defineContentScript({
    matches: ['<all_urls>'],
    runAt: 'document_idle',
    cssInjectionMode: 'ui',
    async main(ctx) {
        onCommand('toggleExtension', async () => {
            await toggleExtension(ctx);
        });
    },
});
