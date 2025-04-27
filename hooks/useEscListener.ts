import type { Ref } from 'vue';
import { onMounted, onUnmounted } from 'vue';

export function useEscListener(
    callback: () => void,
    // eslint-disable-next-line unicorn/prefer-global-this
    target: Window | Ref<HTMLElement | undefined> = window,
) {
    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            callback();
        }
    };

    const getTarget = () => (target instanceof Window ? target : target.value);
    onMounted(() => {
        getTarget()?.addEventListener('keydown', onKeydown as any);
    });

    onUnmounted(() => {
        getTarget()?.removeEventListener('keydown', onKeydown as any);
    });
}
