"""Build offline, single-file DEMO from the same scene shipped in the update.
Usage: python tools/build_ocean_demo.py --phaser /path/phaser.min.js --output /path/index.html
No third-party Python dependencies. Does not modify the formal project's launcher.
"""
from pathlib import Path
import argparse
import base64
import json
import re

parser = argparse.ArgumentParser()
parser.add_argument('--phaser', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
modules = [
    'src/data/AnimalSnackData.js', 'src/scenes/AnimalSnackGame.js',
    'src/data/OceanCleanupData.js', 'src/scenes/OceanCleanupGame.js'
]
parts = ['const modules = {};']
for name in modules:
    source = (root / name).read_text(encoding='utf-8')
    def imp(match):
        names, relative = match.groups()
        dependency = (root / name).parent.joinpath(relative).resolve().relative_to(root).as_posix()
        if names.startswith('{'):
            return f'const {names} = modules[{json.dumps(dependency)}];'
        return f'const {names} = modules[{json.dumps(dependency)}].default;'
    source = re.sub(r"import\s+(.+?)\s+from\s+['\"]([^'\"]+)['\"];", imp, source)
    exports = re.findall(r'export (?:const|class|function)\s+(\w+)', source)
    default = re.search(r'export default class (\w+)', source)
    source = source.replace('export default class ', 'class ').replace('export const ', 'const ').replace('export class ', 'class ').replace('export function ', 'function ')
    if default:
        exports.append('default:' + default.group(1))
    for asset in ['ocean.png', 'sprites.png']:
        local = root / 'assets/ocean-cleanup' / asset
        source = source.replace('assets/ocean-cleanup/' + asset, 'data:image/png;base64,' + base64.b64encode(local.read_bytes()).decode())
    parts.append(f'modules[{json.dumps(name)}] = (() => {{\n{source}\nreturn {{' + ','.join(exports) + '};\n})();')
parts.append('''
const OceanCleanupGame = modules['src/scenes/OceanCleanupGame.js'].default;
const AnimalSnackGame = modules['src/scenes/AnimalSnackGame.js'].default;
class OceanDemoHome extends AnimalSnackGame {
    constructor() { super('OceanDemoHome'); }
    preload() {}
    create() {
        this.add.image(640, 360, 'ocean_background').setDisplaySize(1280, 720);
        this.panel(640, 360, 760, 440, 0xf1fcff, 0xbce4ef);
        this.text(640, 220, '海洋清理隊', 44, '#15566e');
        this.text(640, 290, '和兔子船長一起，把乾淨海洋還給朋友。', 24, '#15566e');
        this.button(640, 404, 300, 72, '開始清理', () => this.scene.start('OceanCleanupGame', { returnScene: 'OceanDemoHome', mode: 'kids' }), 0x206c89);
        this.text(640, 505, '獨立試玩 · 共 12 個任務 · 正式首頁請使用直接覆蓋包', 19, '#527080');
    }
}
new Phaser.Game({ type: Phaser.AUTO, width: 1280, height: 720, parent: 'game-container',
    backgroundColor: '#0e566e', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [OceanCleanupGame, OceanDemoHome] });
''')
script = '\n'.join(parts)
engine = Path(args.phaser).read_text(encoding='utf-8')
html = '''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>海洋清理隊｜幼童獨立試玩 v0.1</title>
<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0e566e}#game-container{width:100%;height:100%;touch-action:none}canvas{display:block}#load-error{display:none;position:fixed;inset:25%;background:white;padding:30px;color:#15566e;font:22px sans-serif;z-index:9}</style>
</head><body><div id="game-container" role="application" aria-label="海洋清理隊，鍵盤1到4選物品，A B C選回收桶，P暫停，H提示，S慢慢玩"></div>
<noscript>請開啟 JavaScript 才能遊玩。</noscript><div id="load-error">遊戲載入遇到問題。請完整解壓縮，再用 Chrome 或 Edge 開啟 index.html。</div>
<script>window.addEventListener('error',()=>{document.getElementById('load-error').style.display='block';});</script>
'''
html += '<script>' + engine.replace('</script', '<\\/script') + '</script>\n'
html += '<script>' + script.replace('</script', '<\\/script') + '</script></body></html>'
output = Path(args.output); output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html, encoding='utf-8')
print(f'Created {output}: {output.stat().st_size} bytes')
