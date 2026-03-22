// src/systems/InventorySystem.js
export default class InventorySystem {
    static getOwnedItems(registry) {
        return registry.get('owned_items') || [];
    }

    static hasItem(registry, itemId) {
        return this.getOwnedItems(registry).includes(itemId);
    }

    static addItem(registry, itemId) {
        const ownedItems = this.getOwnedItems(registry);

        if (!ownedItems.includes(itemId)) {
            ownedItems.push(itemId);
            registry.set('owned_items', ownedItems);
            console.log(`🎁 獲得道具：${itemId}`);
            return true;
        }

        return false;
    }
}