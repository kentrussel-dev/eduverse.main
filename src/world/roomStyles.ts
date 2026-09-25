/** Wallpapers and floors a room owner can pick (ids match the server's RoomStyles). */
export interface Wallpaper { id: string; name: string; color: number; accent?: number; pattern?: 'stripes' | 'brick' | 'panel' | 'planks' }
export interface FloorStyle { id: string; name: string; a: number; b: number; edge: number }

export const WALLPAPERS: Wallpaper[] = [
    { id: 'default', name: 'Classic', color: 0xb8c0d9 },
    { id: 'sky', name: 'Sky', color: 0x9fd3f5 },
    { id: 'mint', name: 'Mint', color: 0xa8e6cf },
    { id: 'peach', name: 'Peach', color: 0xffc8a2 },
    { id: 'lavender', name: 'Lavender', color: 0xc9b6f2 },
    { id: 'sunny', name: 'Sunny', color: 0xffe29a },
    { id: 'stripes', name: 'Stripes', color: 0xf7d9e3, accent: 0xe8a6bd, pattern: 'stripes' },
    { id: 'brick', name: 'Brick', color: 0xb5553c, accent: 0xe6d3c4, pattern: 'brick' },
    { id: 'wood', name: 'Wood', color: 0xb07a45, accent: 0x8f5e33, pattern: 'planks' },
    { id: 'panel', name: 'Panelled', color: 0xe9e1cf, accent: 0x6b8f71, pattern: 'panel' },
    { id: 'night', name: 'Night', color: 0x2b2d52, accent: 0xffe066, pattern: 'stripes' },
    { id: 'candy', name: 'Candy', color: 0xffffff, accent: 0x7bdff2, pattern: 'stripes' },
];

export const FLOORS: FloorStyle[] = [
    { id: 'default', name: 'Classic', a: 0xc9a47a, b: 0xbf9a70, edge: 0x6b4f33 },
    { id: 'oak', name: 'Light oak', a: 0xe3c29a, b: 0xd9b58b, edge: 0x8a6a45 },
    { id: 'checker', name: 'Checker', a: 0xf2f2f2, b: 0x2b2b2b, edge: 0x444444 },
    { id: 'blue-tiles', name: 'Blue tiles', a: 0x8ecae6, b: 0x6fb3d6, edge: 0x3a6f8f },
    { id: 'grass', name: 'Grass', a: 0x7cc36b, b: 0x6fb85e, edge: 0x4a7a3a },
    { id: 'red-carpet', name: 'Red carpet', a: 0xc0392b, b: 0xb53526, edge: 0x6e1f17 },
    { id: 'marble', name: 'Marble', a: 0xecebe7, b: 0xdcdad3, edge: 0x8d8a82 },
    { id: 'pink', name: 'Pink', a: 0xf7b6c8, b: 0xf0a3b8, edge: 0x9c5a6b },
    { id: 'dark-wood', name: 'Dark wood', a: 0x6d4c33, b: 0x5f422c, edge: 0x3a281a },
    { id: 'sand', name: 'Sand', a: 0xf1dca7, b: 0xead196, edge: 0xa38b56 },
    { id: 'ice', name: 'Ice', a: 0xd9f3ff, b: 0xc4ebfb, edge: 0x7fb4c9 },
    { id: 'mint-tiles', name: 'Mint tiles', a: 0xbde8d6, b: 0xa3dcc4, edge: 0x5d9c83 },
];

export const wallpaperOf = (id?: string) => WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
export const floorOf = (id?: string) => FLOORS.find((f) => f.id === id) ?? FLOORS[0];
