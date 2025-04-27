import { onMessage } from 'webext-bridge/content-script';

import type { Command } from '@/constants/commands';

export function onCommand(command: Command, callback: () => void) {
    onMessage('triggerCommand', ({ data }) => {
        if (data.command === command) {
            callback();
        }
    });
}
