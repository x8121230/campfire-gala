const memoryFallback = new Map();

const browserAdapter = {
    getItem(key) {
        try {
            return globalThis.localStorage?.getItem(key) ?? memoryFallback.get(key) ?? null;
        } catch (error) {
            console.warn('無法讀取本機儲存，改用暫存記憶體。', error);
            return memoryFallback.get(key) ?? null;
        }
    },

    setItem(key, value) {
        const text = String(value);
        memoryFallback.set(key, text);
        try {
            globalThis.localStorage?.setItem(key, text);
        } catch (error) {
            console.warn('無法寫入本機儲存，本次僅保留在暫存記憶體。', error);
        }
    },

    removeItem(key) {
        memoryFallback.delete(key);
        try {
            globalThis.localStorage?.removeItem(key);
        } catch (error) {
            console.warn('無法清除本機儲存。', error);
        }
    }
};

export default class PlatformStorage {
    static adapter = browserAdapter;

    static useAdapter(adapter) {
        const valid = adapter
            && typeof adapter.getItem === 'function'
            && typeof adapter.setItem === 'function'
            && typeof adapter.removeItem === 'function';

        if (!valid) throw new Error('儲存轉接器必須提供 getItem、setItem 與 removeItem。');
        this.adapter = adapter;
    }

    static getItem(key) {
        return this.adapter.getItem(key);
    }

    static setItem(key, value) {
        this.adapter.setItem(key, value);
    }

    static removeItem(key) {
        this.adapter.removeItem(key);
    }
}

