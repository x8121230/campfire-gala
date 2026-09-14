// Native-resolution mosaic: 8 independently drawn 1536x1024 tiles, never scaled up.
export const HILLS_TILES = ['west','meadow','grove','gate','southwest','flowers','nursery','arrival'];
export const NEW_HILLS_SIZE = {width:6144,height:2048};
export const NEW_HILLS_OBSTACLES = [
 {type:'ellipse',x:1030,y:137,rx:152,ry:81},
 {type:'ellipse',x:80,y:866,rx:72,ry:50},
 {type:'ellipse',x:360,y:65,rx:51,ry:38},
 {type:'ellipse',x:760,y:63,rx:45,ry:36},
 // Western farm lies above the arena, leaving its eastern/southern openings clear.
 {type:'polygon',points:[[32,32],[253,32],[253,154],[190,194],[32,278]]},
 // Low arena fence: separate segments leave large east and south entrances.
 ...[[66,295,185,222],[190,213,366,189],[375,188,570,219],[590,230,700,332],
 [42,305,32,465],[42,484,105,575],[112,584,295,660],[302,666,548,660],
 [745,485,728,575]].map(([x1,y1,x2,y2])=>({type:'capsule',x1,y1,x2,y2,r:8})),
 ...[
 [1741,140,45,30],[2776,160,170,85],[2926,900,70,45],
 [3172,130,48,32],[3832,100,50,32],[4372,115,48,32],[4472,155,55,25],
 [6078,100,44,32],[6078,420,44,32],[6078,690,44,32],[6078,970,44,32],
 [5348,550,42,27],[5558,500,36,25],
 [365,1104,50,30],[115,1860,110,75],
 [2986,1154,55,34],
 [3472,1704,170,88],[4212,1714,170,88],[3672,1714,20,16],
 [4718,1104,48,30],[6008,1164,50,30],[6008,1954,62,40]
 ].map(([x,y,rx,ry])=>({type:'ellipse',x,y,rx,ry})),
 {type:'polygon',points:[[24,1048],[250,1048],[250,1230],[24,1274]]}
];
