const FULLSCREEN_CLASS = 'mobile-web-fullscreen';
const FULLSCREEN_EVENT = 'forest-fullscreen-change';
let lastViewportSize = '';

function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function requestMethod(target) {
    return target?.requestFullscreen
        || target?.webkitRequestFullscreen
        || target?.webkitRequestFullScreen
        || null;
}

function exitMethod() {
    return document.exitFullscreen
        || document.webkitExitFullscreen
        || document.webkitCancelFullScreen
        || null;
}

export function isIOSDevice() {
    const platform = navigator.userAgent || '';
    return /iPad|iPhone|iPod/i.test(platform)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandaloneMode() {
    return window.matchMedia?.('(display-mode: standalone)').matches === true
        || window.matchMedia?.('(display-mode: fullscreen)').matches === true
        || navigator.standalone === true;
}

export function fullscreenState() {
    if (fullscreenElement()) return 'native';
    if (isStandaloneMode()) return 'standalone';
    if (document.documentElement.classList.contains(FULLSCREEN_CLASS)) return 'fallback';
    return 'windowed';
}

function publishState() {
    window.dispatchEvent(new CustomEvent(FULLSCREEN_EVENT, {
        detail: { state: fullscreenState() }
    }));
}

export function syncMobileViewport() {
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight);
    const width = Math.round(viewport?.width || window.innerWidth || document.documentElement.clientWidth);
    const size = `${width}x${height}`;
    // syncMobileViewport is itself registered as a resize listener.  The old
    // unconditional synthetic resize event therefore called this function
    // again immediately until the browser stack overflowed.
    if (size === lastViewportSize) return;
    lastViewportSize = size;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
    document.documentElement.style.setProperty('--app-width', `${width}px`);
    // Keep Phaser and existing layout listeners informed once, while the
    // size guard makes the re-entrant listener call a safe no-op.
    window.dispatchEvent(new Event('resize'));
}

function setFallbackFullscreen(enabled) {
    document.documentElement.classList.toggle(FULLSCREEN_CLASS, enabled);
    document.body.classList.toggle(FULLSCREEN_CLASS, enabled);
    document.getElementById('game-container')?.classList.toggle(FULLSCREEN_CLASS, enabled);
    syncMobileViewport();
    if (enabled) {
        window.scrollTo(0, 1);
        window.setTimeout(() => {
            syncMobileViewport();
            window.scrollTo(0, 1);
        }, 180);
    }
    publishState();
}

async function lockLandscapeIfAllowed() {
    try {
        if (screen.orientation?.lock) await screen.orientation.lock('landscape');
    } catch (_) {
        // Safari and some Android browsers deliberately disallow orientation lock.
    }
}

export async function toggleMobileFullscreen(target = document.documentElement) {
    const state = fullscreenState();

    if (state === 'native') {
        const exit = exitMethod();
        if (exit) await Promise.resolve(exit.call(document));
        return { ok: true, mode: 'windowed' };
    }

    if (state === 'fallback') {
        setFallbackFullscreen(false);
        return { ok: true, mode: 'windowed' };
    }

    if (state === 'standalone') {
        setFallbackFullscreen(true);
        await lockLandscapeIfAllowed();
        return { ok: true, mode: 'standalone' };
    }

    const request = requestMethod(target);
    if (request) {
        try {
            // This call stays directly inside the user's pointer gesture. Android Chrome,
            // desktop browsers and Safari versions that expose Fullscreen API use it.
            const response = request === target.requestFullscreen
                ? request.call(target, { navigationUI: 'hide' })
                : request.call(target);
            await Promise.resolve(response);
            await lockLandscapeIfAllowed();
            syncMobileViewport();
            return { ok: true, mode: 'native' };
        } catch (error) {
            console.warn('[MobileFullscreen] native request rejected', error);
        }
    }

    // iPhone Safari may not expose element fullscreen for ordinary web pages.
    // Fill every available CSS pixel now, then explain the one-time Home Screen step
    // that removes Safari's browser chrome on subsequent launches.
    setFallbackFullscreen(true);
    return {
        ok: true,
        mode: 'fallback',
        needsInstallHelp: isIOSDevice() && !isStandaloneMode()
    };
}

export function installMobileFullscreenListeners() {
    if (window.__forestMobileFullscreenInstalled) return;
    window.__forestMobileFullscreenInstalled = true;

    ['fullscreenchange', 'webkitfullscreenchange'].forEach((name) => {
        document.addEventListener(name, () => {
            syncMobileViewport();
            publishState();
        });
    });

    window.addEventListener('resize', syncMobileViewport, { passive: true });
    window.addEventListener('orientationchange', () => window.setTimeout(syncMobileViewport, 120), { passive: true });
    window.visualViewport?.addEventListener('resize', syncMobileViewport, { passive: true });
    window.visualViewport?.addEventListener('scroll', syncMobileViewport, { passive: true });
    syncMobileViewport();
}

export { FULLSCREEN_EVENT };
