const TEST_MODE_KEY = 'mini_test_mode_active';
const TEST_GAME_KEY = 'mini_test_game_id';

function cloneValue(value) {
    if (value === undefined) return undefined;
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        return value;
    }
}

function snapshotRegistry(registry) {
    const current = typeof registry?.getAll === 'function' ? registry.getAll() : {};
    return Object.fromEntries(
        Object.entries(current || {}).map(([key, value]) => [key, cloneValue(value)])
    );
}

export default class MiniGameTestSession {
    static activeSession = null;

    static begin(registry, gameId) {
        if (!registry) return;
        if (this.activeSession) this.finish(registry);

        this.activeSession = {
            gameId,
            startedAt: Date.now(),
            snapshot: snapshotRegistry(registry)
        };

        registry.set(TEST_MODE_KEY, true);
        registry.set(TEST_GAME_KEY, gameId);
    }

    static finish(registry) {
        if (!registry || !this.activeSession) {
            if (registry?.get?.(TEST_MODE_KEY) === true) {
                registry.remove(TEST_MODE_KEY);
                registry.remove(TEST_GAME_KEY);
            }
            return null;
        }

        const finishedSession = {
            gameId: this.activeSession.gameId,
            elapsedMs: Math.max(0, Date.now() - this.activeSession.startedAt)
        };
        const snapshot = this.activeSession.snapshot;
        const current = typeof registry.getAll === 'function' ? registry.getAll() : {};

        Object.keys(current || {}).forEach((key) => registry.remove(key));
        Object.entries(snapshot).forEach(([key, value]) => registry.set(key, cloneValue(value)));

        this.activeSession = null;
        return finishedSession;
    }

    static isActive(registry) {
        return registry?.get?.(TEST_MODE_KEY) === true;
    }
}
