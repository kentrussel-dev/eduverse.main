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

/** 50 plain colours (ids "solid-rrggbb") for walls and floors: 10 hues x 4 shades, plus 10 greys and browns. */
const hsl = (h: number, s: number, l: number) => {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
    return (f(0) << 16) | (f(8) << 8) | f(4);
};
export const SOLID_COLORS: number[] = [
    ...[0, 30, 50, 90, 140, 175, 200, 225, 265, 320].flatMap((h) => [0.85, 0.72, 0.58, 0.4].map((l) => hsl(h, 0.65, l))),
    0xffffff, 0xe0e0e0, 0xb0b0b0, 0x7a7a7a, 0x3a3a3a, 0x1b1b1b, 0xf3e5c8, 0xc8a27a, 0x8b5e3c, 0x5a3a22,
];
export const solidId = (color: number) => `solid-${color.toString(16).padStart(6, '0')}`;
const solidColor = (id?: string) => (id && /^solid-[0-9a-f]{6}$/.test(id) ? parseInt(id.slice(6), 16) : null);
const darker = (c: number, by: number) => {
    const ch = (v: number) => Math.max(0, Math.min(255, v + by));
    return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
};

export const wallpaperOf = (id?: string): Wallpaper => {
    const solid = solidColor(id);
    if (solid !== null) return { id: id!, name: 'Plain', color: solid };
    return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
};
export const floorOf = (id?: string): FloorStyle => {
    const solid = solidColor(id);
    if (solid !== null) return { id: id!, name: 'Plain', a: solid, b: solid, edge: darker(solid, -70) };
    return FLOORS.find((f) => f.id === id) ?? FLOORS[0];
};
