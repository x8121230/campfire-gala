import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { inspectLayerPNG, validateManifest } from '../tools/validate-paper-doll-layers.mjs';

// Minimal byte fixture for this decoder; CRC checks belong to image loaders.
function fixture(alpha) {
    const header = Buffer.alloc(33);
    Buffer.from('89504e470d0a1a0a', 'hex').copy(header);
    header.writeUInt32BE(13, 8); header.write('IHDR', 12);
    header.writeUInt32BE(1024, 16); header.writeUInt32BE(1536, 20); header[24] = 8; header[25] = 6;
    const raw = Buffer.alloc((1024 * 4 + 1) * 1536);
    for (let y = 0; y < 1536; y++) for (let x = 0; x < 1024; x++) raw[y * 4097 + 1 + x * 4 + 3] = alpha(x, y);
    const compressed = deflateSync(raw), chunk = Buffer.alloc(compressed.length + 12);
    chunk.writeUInt32BE(compressed.length); chunk.write('IDAT', 4); compressed.copy(chunk, 8);
    return Buffer.concat([header, chunk]);
}
test('validator accepts alpha cutouts and rejects fully opaque or fully empty images', () => {
    const good = inspectLayerPNG(fixture((x, y) => x > 100 && y > 100 ? 255 : 0));
    assert.ok(good.transparentPixels > 0); assert.ok(good.visiblePixels > 0);
    assert.throws(() => inspectLayerPNG(fixture(() => 255)), /透明/);
    assert.throws(() => inspectLayerPNG(fixture(() => 0)), /空白/);
});
test('RGB checkerboards, bad canvas size, broken PNG and unknown slots are rejected', () => {
    const rgb = fixture(() => 255); rgb[25] = 2;
    assert.throws(() => inspectLayerPNG(rgb), /RGBA/);
    const wrongSize = Buffer.from(rgb); wrongSize.writeUInt32BE(512, 16);
    assert.throws(() => inspectLayerPNG(wrongSize), /1024/);
    assert.throws(() => inspectLayerPNG(Buffer.from('not a PNG')), /PNG/);
    const report = validateManifest({}, { outfit: { outfitBody: 'missing', typo: 'oops' } });
    assert.equal(report.ok, false); assert.equal(report.errors.length, 3);
});
test('missing files are reported rather than silently approved', () => {
    const report = validateManifest({ body: 'missing.png' }, { outfit: { outfitBody: 'body' } }, () => { throw new Error('missing file'); });
    assert.equal(report.ok, false); assert.match(report.errors[0], /missing file/);
});
