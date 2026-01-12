const MAX_DELAY = 2147483647; // 2^31 - 1

export default function safeSetTimeout(fn: () => void, delay: number) {
    if (delay <= 0) return setTimeout(fn, 0);

    if (delay <= MAX_DELAY) {
        return setTimeout(fn, delay);
    }

    return setTimeout(() => safeSetTimeout(fn, delay - MAX_DELAY), MAX_DELAY);
}
