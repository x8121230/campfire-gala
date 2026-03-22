// src/utils/DropHelper.js

export function rollTable(table = []) {
    if (!Array.isArray(table) || table.length <= 0) {
        return null;
    }

    const totalWeight = table.reduce((sum, entry) => {
        return sum + (entry.weight || 0);
    }, 0);

    if (totalWeight <= 0) {
        return null;
    }

    let roll = Math.random() * totalWeight;

    for (const entry of table) {
        roll -= (entry.weight || 0);

        if (roll <= 0) {
            return entry;
        }
    }

    return table[table.length - 1] || null;
}