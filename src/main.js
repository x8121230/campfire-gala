// src/main.js
import './patches/GrassTransitionPatch.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import Start from './scenes/Start.js';
import WorldMap from './scenes/WorldMap.js';
import Collection from './scenes/Collection.js';
import TreasureHunt from './scenes/TreasureHunt.js';
import ForestGame from './scenes/ForestGame.js';
import BushExplore from './scenes/BushMinesweeper.js';
import ShapeColorGame from './scenes/ShapeColorGame.js';
import BushBanqiMiniGame from './scenes/BushBanqiMiniGame.js';
import MiniGameHub from './scenes/MiniGameHub.js';
import MemoryMatchGame from './scenes/MemoryMatchGame.js';
import AnimalFoodMatch from './scenes/AnimalFoodMatch.js';
import AnimalSnackGame from './scenes/AnimalSnackGame.js';
import ColorBubbleGame from './scenes/ColorBubbleGame.js';
import OceanCleanupGame from './scenes/OceanCleanupGame.js';
import ForestMechanismGame from './scenes/ForestMechanismGame.js';
import LightWorkshopGame from './scenes/LightWorkshopGame.js';
import ForestCourierGame from './scenes/ForestCourierGame.js';
import ForestMorphGame from './scenes/ForestMorphGame.js';
import ForestFruitGame from './scenes/ForestFruitGame.js';
import ForestSkyGame from './scenes/ForestSkyGame.js';
import ForestAssaultGame from './scenes/ForestAssaultGame.js';
import ForestKitchenGame from './scenes/ForestKitchenGame.js';
import ForestChestRoom from './scenes/ForestChestRoom.js';
import ChestRewardCelebration from './scenes/ChestRewardCelebration.js';
import InstantChestOpen from './scenes/InstantChestOpen.js';
import ChestTestTools from './scenes/ChestTestTools.js';
import EquipmentJournal from './scenes/EquipmentJournal.js';
import AdventureSettings from './scenes/AdventureSettings.js';
import StarlightLake from './scenes/StarlightLake.js';
import RegionAtlas from './scenes/RegionAtlas.js';
import StarlightDetectiveGame from './scenes/StarlightDetectiveGame.js';
import PhantomRealmGame from './scenes/PhantomRealmGame.js';
import PaperForestGame from './scenes/PaperForestGame.js';
import ForestStarflightGame from './scenes/ForestStarflightGame.js';
import ForestNightWatchGame from './scenes/ForestNightWatchGame.js';
import './patches/AdventureSettingsIntegration.js';
import './patches/ChestIntegration.js';
import FireflyExplore from './scenes/FireflyExplore.js';
import FireflyCatchGame from './scenes/FireflyCatchGame.js';
import ConstellationGame from './scenes/ConstellationGame.js';
import CampfireGame from './scenes/CampfireGame.js';
import GMPanel from './scenes/GMPanel.js';

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
        BushExplore,
        ShapeColorGame,
        BushBanqiMiniGame,
        MiniGameHub,
        MemoryMatchGame,
        AnimalFoodMatch,
        AnimalSnackGame,
        ColorBubbleGame,
        OceanCleanupGame,
        ForestMechanismGame,
        LightWorkshopGame,
        ForestCourierGame,
        ForestMorphGame,
        ForestFruitGame,
        ForestSkyGame,
        ForestAssaultGame,
        ForestKitchenGame,
        ForestChestRoom,
        ChestRewardCelebration,
        InstantChestOpen,
        ChestTestTools,
        EquipmentJournal,
        AdventureSettings,
        StarlightLake,
        RegionAtlas,
        StarlightDetectiveGame,
        ForestNightWatchGame,
        PhantomRealmGame,
        PaperForestGame,
        ForestStarflightGame,
        FireflyExplore,
        FireflyCatchGame,
        ConstellationGame,
        CampfireGame,
        GMPanel
    ]
};

new Phaser.Game(config);
