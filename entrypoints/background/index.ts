import { sendMessage } from 'webext-bridge/background';

import type { Command } from '@/constants/commands';

import { registerServices } from './services';

export default defineBackground(() => {
    registerServices();

    // transfer commands to content script
    browser.commands.onCommand.addListener(async (command) => {
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        sendMessage(
            'triggerCommand',
            { command: command as Command },
            `content-script@${activeTab.id}`,
        );
    });
});
