import { Dir } from './types';

/** Screen directions: south is toward the viewer, east is screen-right. */
export type Dir8 = 's' | 'se' | 'e' | 'ne' | 'n' | 'nw' | 'w' | 'sw';

/**
 * The direction for a walking step of (dx, dy) tiles, from where the step goes on screen.
 * Tile (x, y) is at screen ((x - y) * 32, (x + y) * 16).
 */
export const dirForStep = (dx: number, dy: number): Dir8 => {
    const px = (dx - dy) * 32;
    const py = (dx + dy) * 16;
    const angle = Math.atan2(py, px); // 0 = right, +90deg = down
    const dirs: Dir8[] = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
    const index = Math.round(angle / (Math.PI / 4));
    return dirs[(index + 8) % 8];
};

/** Tile facings (used by furniture) point along the tile axes, which are screen diagonals. */
export const dirForFacing = (dir: Dir): Dir8 => dir;

/**
 * The avatar sprites face four ways (sheet rows: up, left, down, right). Anything heading
 * right, even diagonally, uses the right-facing row and anything heading left the left-facing
 * row; only straight up and straight down use the back and front rows.
 */
export const ROW_FOR_DIR: Record<Dir8, number> = { n: 0, nw: 1, w: 1, sw: 1, s: 2, ne: 3, e: 3, se: 3 };
