export function grantAllItemsForTesting(registry, itemDb) {
    const ownedItems = new Set(Array.isArray(registry.get('owned_items')) ? registry.get('owned_items') : []);
    const ownedCollectibles = new Set(Array.isArray(registry.get('owned_collectibles')) ? registry.get('owned_collectibles') : []);
    const unread = new Set(Array.isArray(registry.get('new_items')) ? registry.get('new_items') : []);
    const added = [];

    Object.keys(itemDb).forEach(id => {
        const target = itemDb[id]?.type === 'collectible' ? ownedCollectibles : ownedItems;
        if (target.has(id)) return;
        target.add(id);
        unread.add(id);
        added.push(id);
    });

    registry.set('owned_items', [...ownedItems]);
    registry.set('owned_collectibles', [...ownedCollectibles]);
    registry.set('new_items', [...unread]);
    return added;
}
