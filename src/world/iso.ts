import { Graphics } from 'pixi.js';
import { Dir } from './types';

// Isometric projection: a tile is a 64x32 diamond. Tile (x, y) has its top corner at
// ((x - y) * 32, (x + y) * 16). +x runs down-right on screen, +y runs down-left.
export const TILE_W = 64;
export const TILE_H = 32;
const HALF_W = TILE_W / 2;
const HALF_H = TILE_H / 2;

/** Screen position of a point in tile space (x, y may be fractional) raised z pixels. */
export const project = (x: number, y: number, z = 0) => ({
    x: (x - y) * HALF_W,
    y: (x + y) * HALF_H - z,
});

/** Screen position of the center of tile (x, y). */
export const tileCenter = (x: number, y: number) => project(x + 0.5, y + 0.5);

/** The tile under a screen point (in world-container coordinates). */
export const screenToTile = (sx: number, sy: number) => {
    const fx = (sy / HALF_H + sx / HALF_W) / 2;
    const fy = (sy / HALF_H - sx / HALF_W) / 2;
    return { x: Math.floor(fx), y: Math.floor(fy) };
};

/** Which way an avatar faces when stepping by (dx, dy). */
export const dirFromStep = (dx: number, dy: number): Dir => {
    const sx = dx - dy;
    const sy = dx + dy;
    return `${sy >= 0 ? 's' : 'n'}${sx >= 0 ? 'e' : 'w'}` as Dir;
};

export const shade = (hex: number, amount: number) => {
    const r = Math.min(255, Math.max(0, ((hex >> 16) & 0xff) + amount));
    const g = Math.min(255, Math.max(0, ((hex >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (hex & 0xff) + amount));
    return (r << 16) | (g << 8) | b;
};

export const hexToNumber = (hex: string) => parseInt(hex.replace('#', ''), 16);

const poly = (g: Graphics, color: number, points: { x: number; y: number }[], alpha = 1) => {
    g.beginFill(color, alpha);
    g.drawPolygon(points.flatMap((p) => [p.x, p.y]));
    g.endFill();
};

/**
 * Draws a box in tile space: footprint [x0, x1] x [y0, y1] from height z0 to z1 (pixels).
 * Only the three faces a viewer can see are drawn: top, the +y face (left) and the +x face (right).
 */
export const prism = (
    g: Graphics,
    x0: number, x1: number, y0: number, y1: number, z0: number, z1: number,
    color: number,
) => {
    poly(g, shade(color, -28), [project(x0, y1, z1), project(x1, y1, z1), project(x1, y1, z0), project(x0, y1, z0)]);
    poly(g, shade(color, -52), [project(x1, y0, z1), project(x1, y1, z1), project(x1, y1, z0), project(x1, y0, z0)]);
    poly(g, color, [project(x0, y0, z1), project(x1, y0, z1), project(x1, y1, z1), project(x0, y1, z1)]);
};

/** A flat diamond covering tile-space rectangle at height z. */
export const flat = (g: Graphics, x0: number, x1: number, y0: number, y1: number, z: number, color: number, alpha = 1) => {
    poly(g, color, [project(x0, y0, z), project(x1, y0, z), project(x1, y1, z), project(x0, y1, z)], alpha);
};

export { poly };
