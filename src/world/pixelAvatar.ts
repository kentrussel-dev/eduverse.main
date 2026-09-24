import { BaseTexture, SCALE_MODES, Texture } from 'pixi.js';
import { FEET_Y, FLOOR_DROP, FRAME_H, FRAME_W, HEAD_TOP, Pose, PoseKind, renderFigure, SIT_DROP, View } from './avatarArt';
import { AvatarLook, Dir } from './types';

/**
 * Avatar frames for the room: pixel art from avatarArt.ts (drawn in the style of the LPC
 * sprites), turned into crisp Pixi textures. Like Habbo there are 8 facing directions: five
 * views are drawn (front, front three-quarter, side, back three-quarter, back) and the other
 * three are mirror images.
 */

/** Screen directions: south is toward the viewer, east is screen-right. */
export type Dir8 = 's' | 'se' | 'e' | 'ne' | 'n' | 'nw' | 'w' | 'sw';

export type { Pose, PoseKind };
export { FRAME_W, FRAME_H, FEET_Y, HEAD_TOP, SIT_DROP, FLOOR_DROP };

const VIEW_FOR: Record<Dir8, { view: View; mirror: boolean }> = {
    s: { view: 'front', mirror: false },
    se: { view: 'front34', mirror: false },
    e: { view: 'side', mirror: false },
    ne: { view: 'back34', mirror: false },
    n: { view: 'back', mirror: false },
    nw: { view: 'back34', mirror: true },
    w: { view: 'side', mirror: true },
    sw: { view: 'front34', mirror: true },
};

export const viewFor = (dir: Dir8) => VIEW_FOR[dir];

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

// ---- frames and caching ----

const canvases = new Map<string, HTMLCanvasElement>();
const textures = new Map<string, Texture>();

const frameKey = (look: AvatarLook, view: View, pose: Pose) =>
    `${JSON.stringify(look)}|${view}|${pose.kind}|${pose.kind === 'walk' ? pose.frame : 0}|${pose.nearArmUp ? 1 : 0}${pose.bothArmsUp ? 1 : 0}${pose.blink ? 1 : 0}`;

const frameCanvas = (look: AvatarLook, view: View, pose: Pose) => {
    const key = frameKey(look, view, pose);
    let canvas = canvases.get(key);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = FRAME_W;
        canvas.height = FRAME_H;
        canvas.getContext('2d')!.putImageData(new ImageData(renderFigure(look, view, pose), FRAME_W, FRAME_H), 0, 0);
        canvases.set(key, canvas);
    }
    return { key, canvas };
};

/** The texture for a look, direction and pose, plus whether to mirror it. */
export const avatarFrame = (look: AvatarLook, dir: Dir8, pose: Pose) => {
    const { view, mirror } = VIEW_FOR[dir];
    const { key, canvas } = frameCanvas(look, view, pose);
    let texture = textures.get(key);
    if (!texture) {
        texture = new Texture(BaseTexture.from(canvas, { scaleMode: SCALE_MODES.NEAREST }));
        textures.set(key, texture);
    }
    return { texture, mirror };
};

/** For browser tests: every direction and pose of a look on one canvas, as a data URL. */
export const contactSheet = (look: AvatarLook, scale = 3) => {
    const dirs: Dir8[] = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
    const poses: Pose[] = [
        { kind: 'stand', frame: 0, nearArmUp: false, bothArmsUp: false, blink: false },
        ...[0, 1, 2, 3].map((frame) => ({ kind: 'walk' as const, frame, nearArmUp: false, bothArmsUp: false, blink: false })),
        { kind: 'sit', frame: 0, nearArmUp: false, bothArmsUp: false, blink: false },
        { kind: 'floor', frame: 0, nearArmUp: false, bothArmsUp: false, blink: false },
        { kind: 'stand', frame: 0, nearArmUp: true, bothArmsUp: false, blink: false },
    ];
    const out = document.createElement('canvas');
    out.width = FRAME_W * poses.length * scale;
    out.height = FRAME_H * dirs.length * scale;
    const ctx = out.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#c9a47a';
    ctx.fillRect(0, 0, out.width, out.height);
    dirs.forEach((dir, row) => poses.forEach((pose, col) => {
        const { view, mirror } = VIEW_FOR[dir];
        const { canvas } = frameCanvas(look, view, pose);
        ctx.save();
        ctx.translate((col * FRAME_W + (mirror ? FRAME_W : 0)) * scale, row * FRAME_H * scale);
        ctx.scale(mirror ? -scale : scale, scale);
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
    }));
    return out.toDataURL();
};

export const standing: Pose = { kind: 'stand', frame: 0, nearArmUp: false, bothArmsUp: false, blink: false };

/** A picture of a look facing front-right, cropped to the figure and scaled up crisply. */
export const portrait = (look: AvatarLook, scale = 3) => {
    const { canvas } = frameCanvas(look, 'front34', standing);
    const ctx = canvas.getContext('2d')!;
    const { data } = ctx.getImageData(0, 0, FRAME_W, FRAME_H);
    let [x0, y0, x1, y1] = [FRAME_W, FRAME_H, 0, 0];
    for (let y = 0; y < FRAME_H; y++) {
        for (let x = 0; x < FRAME_W; x++) {
            // skip the soft shadow when cropping
            if (data[(y * FRAME_W + x) * 4 + 3] > 100) {
                x0 = Math.min(x0, x);
                y0 = Math.min(y0, y);
                x1 = Math.max(x1, x);
                y1 = Math.max(y1, y);
            }
        }
    }
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const out = document.createElement('canvas');
    out.width = w * scale;
    out.height = h * scale;
    const octx = out.getContext('2d')!;
    octx.imageSmoothingEnabled = false;
    octx.drawImage(canvas, x0, y0, w, h, 0, 0, w * scale, h * scale);
    return out.toDataURL();
};

if (process.env.REACT_APP_E2E === 'true') {
    // Lets browser tests render contact sheets of every direction and pose.
    (window as any).eduverseAvatar = { contactSheet };
}
