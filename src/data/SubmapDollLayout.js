// Coordinates use the same 1280 x 720 design space as WorldMap backgrounds.
// All four layers share one scale; foot anchors refer to the v7 master canvas.
export const SUBMAP_DOLL_PLACEMENTS = Object.freeze({
    morning_camp: { footX: 450, footY: 646, height: 292 },
    emerald_woods: { footX: 580, footY: 650, height: 278 },
    mosslight_valley: { footX: 500, footY: 665, height: 286 },
    bubble_bay: { footX: 610, footY: 680, height: 270 },
    coral_maze: { footX: 590, footY: 690, height: 265 },
    jellyfish_palace: { footX: 600, footY: 695, height: 262 },
    flower_crown_village: { footX: 620, footY: 696, height: 266 },
    dew_garden: { footX: 630, footY: 700, height: 260 },
    moon_butterfly_market: { footX: 620, footY: 700, height: 260 },
    snowbell_field: { footX: 620, footY: 700, height: 260 },
    ice_mirror_lake: { footX: 620, footY: 700, height: 260 },
    aurora_palace: { footX: 620, footY: 700, height: 260 },
    warmflame_foothill: { footX: 620, footY: 700, height: 260 },
    molten_workshop: { footX: 620, footY: 700, height: 260 },
    starfire_summit: { footX: 620, footY: 700, height: 260 },
    moonshadow_shore: { footX: 620, footY: 700, height: 260 },
    glow_reeds: { footX: 620, footY: 700, height: 260 },
    star_sunken_heart: { footX: 620, footY: 700, height: 260 },
    fossil_wilds: { footX: 620, footY: 700, height: 260 },
    giant_fern_jungle: { footX: 620, footY: 700, height: 260 },
    ancient_nest_valley: { footX: 620, footY: 700, height: 260 },
    pawn_harbor: { footX: 620, footY: 700, height: 260 },
    knight_gallery: { footX: 620, footY: 700, height: 260 },
    crown_chess_city: { footX: 620, footY: 700, height: 260 },
    cloud_meadow: { footX: 620, footY: 700, height: 260 },
    windchime_isle: { footX: 620, footY: 700, height: 260 },
    sky_temple: { footX: 620, footY: 700, height: 260 }
});

// A single explicit multiplier prevents repeated scene entry from compounding
// the requested 30% enlargement.
export const SUBMAP_DOLL_SCALE = 1.3;

export function getSubmapDollLayout(submapId, base) {
    const safeBase = base || {
        centerX: 640, centerY: 520, maxWidth: 168, maxHeight: 252,
        hatAnchorX: 0.67, hatAnchorY: 0.205,
        accessoryAnchorX: 0.77, accessoryAnchorY: 0.53
    };
    const p = SUBMAP_DOLL_PLACEMENTS[submapId];
    const footRatio = 1266 / 1290;
    const height = (p?.height || safeBase.maxHeight) * SUBMAP_DOLL_SCALE;
    const footX = p?.footX ?? safeBase.centerX;
    const footY = p?.footY ?? (safeBase.centerY + (footRatio - .5) * safeBase.maxHeight);
    return {
        ...safeBase,
        centerX: footX,
        centerY: footY - (footRatio - .5) * height,
        maxWidth: height * 768 / 1290,
        maxHeight: height,
        footX,
        footY
    };
}
