// src/main.js
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import Start from './scenes/Start.js';
import WorldMap from './scenes/WorldMap.js';
import Collection from './scenes/Collection.js';
import TreasureHunt from './scenes/TreasureHunt.js';
import ForestGame from './scenes/ForestGame.js';
import BushExplore from './scenes/BushExplore.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        fullscreenTarget: document.getElementById('game-container')
    },
    scene: [
        BootScene,
        PreloadScene,
        Start,
        WorldMap,
        Collection,
        TreasureHunt,
        ForestGame,
        BushExplore
    ]
};

new Phaser.Game(config);