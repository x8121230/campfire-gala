import { resolveLayers, layerTransform, LAYER_ORDER } from '../data/PaperDollLayers.js';

// Creates only doll nodes. Container ownership and cleanup stay with the caller.
// The wardrobe can keep its existing equip pulse (direct Image children).
export function renderPaperDoll(scene, parent, look, layout, { drawClip, outfits, combos } = {}) {
    const plan = resolveLayers(look, key => scene.textures.exists(key), outfits, combos);
    const nodes = [];
    for (const slot of LAYER_ORDER) {
        for (const layer of plan.layers.filter(entry => entry.slot === slot)) {
            const node = scene.add.image(layout.centerX, layout.centerY, layer.texture);
            const transform = layerTransform(layer, layout, node);
            node.setPosition(transform.x, transform.y);
            node.setOrigin(.5).setScale(transform.scale).setName(`paper-doll-${slot}`);
            parent.add(node);
            nodes.push(node);
            if (slot === 'effectFront' && scene.tweens?.add) {
                scene.tweens.add({ targets: node, y: transform.y - 10 * transform.scale, alpha: .55, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                node.once?.('destroy', () => scene.tweens.killTweensOf(node));
            }
        }
        if (slot === 'headStyle' && plan.proceduralClip && drawClip) {
            const left = layout.centerX - layout.maxWidth / 2;
            const top = layout.centerY - layout.maxHeight / 2;
            drawClip(parent, left + layout.maxWidth * layout.hatAnchorX, top + layout.maxHeight * .2, 33);
        }
    }
    return { ...plan, nodes };
}
