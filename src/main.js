// src/main.js
import './patches/GrassTransitionPatch.js';
import './patches/ChestIntegration.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import Start from './scenes/Start.js';
import WorldAtlas from './scenes/WorldAtlas.js';
import FogUnlock from './scenes/FogUnlock.js';
import RegionGuide from './scenes/RegionGuide.js';
import SubmapGames from './scenes/SubmapGames.js';
import FreeExplore from './scenes/FreeExplore.js';
import RealmPortalTransition from './scenes/RealmPortalTransition.js';
import RealmWorldGame from './scenes/RealmWorldGameV2.js';
import DawnDandelionHillsGame from './scenes/DawnDandelionHillsGame.js';
import WorldMap from './scenes/WorldMap.js';
import Collection from './scenes/Collection.js';
import TreasureHunt from './scenes/TreasureHunt.js';
import ForestGame from './scenes/ForestGame.js';
import BushExplore from './scenes/BushMinesweeper.js';
import ShapeColorGame from './scenes/ShapeColorGame.js';
import BushBanqiMiniGame from './scenes/BushBanqiMiniGame.js';
import MiniGameHub from './scenes/MiniGameHub.js?v=handbook-box-direct101';
import MemoryMatchGame from './scenes/MemoryMatchGame.js';
import AnimalFoodMatch from './scenes/AnimalFoodMatch.js';
import AnimalSnackGame from './scenes/AnimalSnackGame.js';
import ColorBubbleGame from './scenes/ColorBubbleGame.js';
import OceanCleanupGame from './scenes/OceanCleanupGame.js';
import IceSkiGame from './scenes/IceSkiGame.js';
import PenguinIcePuzzleGame from './scenes/PenguinIcePuzzleGame.js';
import SnowballDefenseGame from './scenes/SnowballDefenseGame.js';
import SealRescueGame from './scenes/SealRescueGame.js';
import SledDeliveryGame from './scenes/SledDeliveryGame.js';
import IceTapRescueGame from './scenes/IceTapRescueGame.js';
import SnowmanShapeGame from './scenes/SnowmanShapeGame.js';
import IceFishingGame from './scenes/IceFishingGame.js';
import SnowHouseMemoryGame from './scenes/SnowHouseMemoryGame.js';
import PenguinSlideMazeGame from './scenes/PenguinSlideMazeGame.js';
import VolcanoWorldMap from './scenes/VolcanoWorldMap.js';
import VolcanoBonusMap from './scenes/VolcanoBonusMap.js';
import LavaBubblePopGame from './scenes/LavaBubblePopGame.js';
import PteroFossilPuzzleGame from './scenes/PteroFossilPuzzleGame.js';
import VolcanoGemCartGame from './scenes/VolcanoGemCartGame.js';
import HotSpringCapybaraGame from './scenes/HotSpringCapybaraGame.js';
import JellySeaBridgeGame from './scenes/JellySeaBridgeGame.js';
import CloudGlideGame from './scenes/CloudGlideGame.js';
import DinosaurValleyGame from './scenes/DinosaurValleyGame.js';
import WaterFlowMazeGame from './scenes/WaterFlowMazeGame.js';
import JumpClimbGame from './scenes/JumpClimbGame.js';
import StarlightFireflyGame from './scenes/StarlightFireflyGame.js';
import FruitCountingGame from './scenes/FruitCountingGame.js';
import ForestStarflightGame from './scenes/ForestStarflightGame.js?v=star0201';
import { LavaStepGame, CoolingWorkshopGame, LavaPipeGame, VolcanoEchoGame, LavaBridgeGame } from './scenes/VolcanoSeriesGames.js';
import FireflyExplore from './scenes/FireflyExplore.js';
import FireflyCatchGame from './scenes/FireflyCatchGame.js';
import ConstellationGame from './scenes/ConstellationGame.js';
import CampfireGame from './scenes/CampfireGame.js';
import ForestChestRoom from './scenes/ForestChestRoom.js';
import EquipmentJournal from './scenes/EquipmentJournal.js';
import ChestRewardCelebration from './scenes/ChestRewardCelebration.js';
import InstantChestOpen from './scenes/InstantChestOpen.js';
import ChestTestTools from './scenes/ChestTestTools.js';
import GMPanel from './scenes/GMPanel.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    loader: {
        maxParallelDownloads: 16,
        timeout: 12000
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        fullscreenTarget: document.getElementById('game-container')
    },
    scene: [
        BootScene,
        PreloadScene,
        Start,
        WorldAtlas,
        FogUnlock,
        RegionGuide,
        SubmapGames,
        FreeExplore,
        RealmPortalTransition,
        RealmWorldGame,
        DawnDandelionHillsGame,
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
        IceSkiGame,
        PenguinIcePuzzleGame,
        SnowballDefenseGame,
        SealRescueGame,
        SledDeliveryGame,
        IceTapRescueGame,
        SnowmanShapeGame,
        IceFishingGame,
        SnowHouseMemoryGame,
        PenguinSlideMazeGame,
        VolcanoWorldMap,
        VolcanoBonusMap,
        LavaBubblePopGame,
        PteroFossilPuzzleGame,
        VolcanoGemCartGame,
        HotSpringCapybaraGame,
        JellySeaBridgeGame,
        CloudGlideGame,
        DinosaurValleyGame,
        WaterFlowMazeGame,
        JumpClimbGame,
        StarlightFireflyGame,
        FruitCountingGame,
        ForestStarflightGame,
        LavaStepGame,
        CoolingWorkshopGame,
        LavaPipeGame,
        VolcanoEchoGame,
        LavaBridgeGame,
        FireflyExplore,
        FireflyCatchGame,
        ConstellationGame,
        CampfireGame,
        ForestChestRoom,
        EquipmentJournal,
        ChestRewardCelebration,
        InstantChestOpen,
        ChestTestTools,
        GMPanel
    ]
};

new Phaser.Game(config);
