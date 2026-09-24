import { BaseTexture, SCALE_MODES, Texture } from 'pixi.js';
import { AvatarLook, Dir } from './types';

/**
 * Habbo-style pixel avatars, drawn in code at 1x on a small canvas so every pixel is crisp.
 * Like Habbo there are 8 facing directions: five views are drawn (front, front three-quarter,
 * side, back three-quarter, back) and the other three are mirror images.
 */

/** Screen directions: south is toward the viewer, east is screen-right. */
export type Dir8 = 's' | 'se' | 'e' | 'ne' | 'n' | 'nw' | 'w' | 'sw';
type View = 'front' | 'front34' | 'side' | 'back34' | 'back';

export type PoseKind = 'stand' | 'walk' | 'sit' | 'floor';

export interface Pose {
    kind: PoseKind;
    /** Walk frame 0-3. */
    frame: number;
    /** Raise the arm nearest the viewer (wave, hand up). */
    nearArmUp: boolean;
    /** Raise both arms (dancing). */
    bothArmsUp: boolean;
    blink: boolean;
}

export const FRAME_W = 40;
export const FRAME_H = 72;
/** Where the feet touch the floor inside a frame. */
export const FEET_Y = 69;

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

// ---- colors ----

const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const shadeHex = (hex: string, amount: number) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = clampByte(((n >> 16) & 255) + amount);
    const g = clampByte(((n >> 8) & 255) + amount);
    const b = clampByte((n & 255) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

interface Palette {
    skin: string; skinDark: string; skinLine: string;
    hair: string; hairDark: string;
    shirt: string; shirtDark: string; shirtLine: string;
    pants: string; pantsDark: string; pantsLine: string;
    shoes: string; shoesDark: string;
    hat: string; hatDark: string;
}

const paletteFor = (look: AvatarLook): Palette => ({
    skin: look.skin, skinDark: shadeHex(look.skin, -30), skinLine: shadeHex(look.skin, -95),
    hair: look.hair, hairDark: shadeHex(look.hair, -40),
    shirt: look.shirt, shirtDark: shadeHex(look.shirt, -35), shirtLine: shadeHex(look.shirt, -95),
    pants: look.pants, pantsDark: shadeHex(look.pants, -30), pantsLine: shadeHex(look.pants, -80),
    shoes: look.shoes, shoesDark: shadeHex(look.shoes, -50),
    hat: look.hatColor, hatDark: shadeHex(look.hatColor, -50),
});

// ---- drawing helpers (integer pixels only) ----

type Ctx = CanvasRenderingContext2D;

const rect = (ctx: Ctx, x: number, y: number, w: number, h: number, color: string) => {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** A filled block with a 1px outline and a shaded right edge; `round` trims the corners. */
const block = (ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, line: string, shadow: string, round = 0) => {
    rect(ctx, x, y, w, h, line);
    rect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
    rect(ctx, x + w - 3, y + 1, 2, h - 2, shadow);
    for (let i = 0; i < round; i++) {
        // cut the corners in steps so the shape reads as rounded
        const cut = round - i;
        ctx.clearRect(x, y + i, cut, 1);
        ctx.clearRect(x + w - cut, y + i, cut, 1);
        ctx.clearRect(x, y + h - 1 - i, cut, 1);
        ctx.clearRect(x + w - cut, y + h - 1 - i, cut, 1);
        rect(ctx, x + cut, y + i, 1, 1, line);
        rect(ctx, x + w - cut - 1, y + i, 1, 1, line);
        rect(ctx, x + cut, y + h - 1 - i, 1, 1, line);
        rect(ctx, x + w - cut - 1, y + h - 1 - i, 1, 1, line);
    }
};

// ---- figure geometry per view ----

interface Geometry {
    head: { x: number; y: number; w: number; h: number };
    torso: { x: number; w: number };
    armNear: number;
    armFar: number | null;
    /** Arm widths. */
    armW: number;
    farArmBehind: boolean;
    legs: [number, number];
    legW: number;
    face: 'front' | 'front34' | 'side' | 'none';
}

const GEOMETRY: Record<View, Geometry> = {
    front: { head: { x: 10, y: 17, w: 20, h: 20 }, torso: { x: 12, w: 16 }, armNear: 28, armFar: 8, armW: 4, farArmBehind: false, legs: [13, 21], legW: 6, face: 'front' },
    front34: { head: { x: 11, y: 17, w: 20, h: 20 }, torso: { x: 13, w: 14 }, armNear: 26, armFar: 10, armW: 4, farArmBehind: true, legs: [14, 20], legW: 6, face: 'front34' },
    side: { head: { x: 11, y: 17, w: 19, h: 20 }, torso: { x: 15, w: 10 }, armNear: 18, armFar: 17, armW: 4, farArmBehind: true, legs: [16, 17], legW: 7, face: 'side' },
    back34: { head: { x: 9, y: 17, w: 20, h: 20 }, torso: { x: 13, w: 14 }, armNear: 10, armFar: 26, armW: 4, farArmBehind: true, legs: [14, 20], legW: 6, face: 'none' },
    back: { head: { x: 10, y: 17, w: 20, h: 20 }, torso: { x: 12, w: 16 }, armNear: 28, armFar: 8, armW: 4, farArmBehind: false, legs: [13, 21], legW: 6, face: 'none' },
};

const TORSO_TOP = 37;
const TORSO_H = 17;
const LEG_TOP = 53;

// ---- parts ----

const drawLegs = (ctx: Ctx, look: AvatarLook, p: Palette, g: Geometry, view: View, pose: Pose, drop: number) => {
    const bottomColor = look.bottom === 'pants' && look.top !== 'dress' ? p.pants : p.skin;
    const bottomLine = look.bottom === 'pants' && look.top !== 'dress' ? p.pantsLine : p.skinLine;
    const bottomShade = look.bottom === 'pants' && look.top !== 'dress' ? p.pantsDark : p.skinDark;
    const shorts = look.bottom === 'shorts' && look.top !== 'dress';

    const leg = (x: number, top: number, bottom: number, w = g.legW) => {
        block(ctx, x, top, w, bottom - top, bottomColor, bottomLine, bottomShade);
        if (shorts) block(ctx, x, top, w, 6, p.pants, p.pantsLine, p.pantsDark);
        block(ctx, x - (view === 'side' ? 0 : 0), bottom - 3, w + (view === 'front' || view === 'back' ? 0 : 1), 3, p.shoes, p.shoesDark, p.shoesDark);
    };

    if (pose.kind === 'sit' || pose.kind === 'floor') {
        const kneeY = LEG_TOP + drop;
        if (view === 'side' || view === 'front34' || view === 'back34') {
            // thighs point the way the figure faces (right in the unmirrored frame)
            const x0 = view === 'side' ? 16 : 15;
            const reach = pose.kind === 'floor' ? 15 : 11;
            const w = view === 'side' ? g.legW : 11;
            block(ctx, x0, kneeY, reach + 2, 6, bottomColor, bottomLine, bottomShade);
            if (shorts) block(ctx, x0, kneeY, 7, 6, p.pants, p.pantsLine, p.pantsDark);
            if (pose.kind === 'sit') {
                block(ctx, x0 + reach - 4, kneeY + 3, 6, FEET_Y - (kneeY + 3), bottomColor, bottomLine, bottomShade);
                block(ctx, x0 + reach - 4, FEET_Y - 3, 8, 3, p.shoes, p.shoesDark, p.shoesDark);
            } else {
                block(ctx, x0 + reach + 1, kneeY + 1, 3, 5, p.shoes, p.shoesDark, p.shoesDark);
            }
            void w;
        } else {
            // facing toward or away from the viewer: knees come forward, shins hang down
            for (const x of g.legs) {
                if (pose.kind === 'sit') leg(x, kneeY, FEET_Y);
                else {
                    block(ctx, x, kneeY, g.legW, FEET_Y - kneeY, bottomColor, bottomLine, bottomShade);
                    block(ctx, x, FEET_Y - 3, g.legW, 3, p.shoes, p.shoesDark, p.shoesDark);
                }
            }
        }
        return;
    }

    const f = pose.kind === 'walk' ? pose.frame : -1;
    if (view === 'side') {
        // one leg forward, one back; together on the passing frames
        const spread = f === 0 ? 3 : f === 2 ? -3 : 0;
        leg(g.legs[0] - spread, LEG_TOP, FEET_Y - (f === 1 ? 1 : 0));
        leg(g.legs[1] + spread, LEG_TOP, FEET_Y - (f === 3 ? 1 : 0));
        return;
    }
    // Facing the viewer or away: the stepping leg lifts a little.
    const liftA = f === 0 ? 2 : 0;
    const liftB = f === 2 ? 2 : 0;
    leg(g.legs[0], LEG_TOP, FEET_Y - liftA);
    leg(g.legs[1], LEG_TOP, FEET_Y - liftB);
};

const drawTorso = (ctx: Ctx, look: AvatarLook, p: Palette, g: Geometry, view: View, top: number) => {
    const { x, w } = g.torso;
    block(ctx, x, top, w, TORSO_H, p.shirt, p.shirtLine, p.shirtDark, 2);
    const facing = view === 'front' || view === 'front34';
    const cx = view === 'front34' ? x + Math.floor(w / 2) + 2 : x + Math.floor(w / 2);

    if (look.top === 'uniform' && facing) {
        rect(ctx, cx - 3, top + 1, 6, 2, '#ffffff');
        rect(ctx, cx - 1, top + 3, 2, 7, '#1d3557');
    }
    if (look.top === 'hoodie' && facing) {
        // cardigan: open front showing a white shirt, with buttons
        rect(ctx, cx - 2, top + 1, 4, TORSO_H - 3, '#f1f1f1');
        rect(ctx, cx - 3, top + 4, 1, 1, p.shirtLine);
        rect(ctx, cx - 3, top + 8, 1, 1, p.shirtLine);
    }
    if (look.top === 'jersey' && facing) {
        // V-neck
        rect(ctx, cx - 2, top + 1, 4, 1, p.skin);
        rect(ctx, cx - 1, top + 2, 2, 2, p.skin);
    }
    if (look.top === 'dress') {
        // dress: the skirt in the top color
        rect(ctx, x - 1, top + TORSO_H - 4, w + 2, 1, p.shirtLine);
        block(ctx, x - 2, top + TORSO_H - 3, w + 4, 9, p.shirt, p.shirtLine, p.shirtDark);
    } else if (look.bottom === 'skirt') {
        block(ctx, x - 2, top + TORSO_H - 3, w + 4, 9, p.pants, p.pantsLine, p.pantsDark);
    } else {
        // waistband
        rect(ctx, x + 1, top + TORSO_H - 3, w - 2, 2, p.pantsDark);
    }
};

const drawArm = (ctx: Ctx, look: AvatarLook, p: Palette, x: number, top: number, w: number, swing: number, up: boolean, behind: boolean) => {
    const sleeveLong = look.top === 'longsleeve' || look.top === 'hoodie';
    const line = behind ? shadeHex(p.shirtLine, -10) : p.shirtLine;
    const shirt = behind ? p.shirtDark : p.shirt;
    const skin = behind ? p.skinDark : p.skin;
    if (up) {
        // raised above the shoulder
        const armTop = top - 13;
        block(ctx, x, armTop, w, 14, sleeveLong ? shirt : skin, sleeveLong ? line : p.skinLine, sleeveLong ? p.shirtDark : p.skinDark);
        if (!sleeveLong) block(ctx, x, top - 3, w, 5, shirt, line, p.shirtDark);
        block(ctx, x, armTop - 3, w, 4, skin, p.skinLine, p.skinDark);
        return;
    }
    const y = top + 1 + swing;
    block(ctx, x, y, w, 12, sleeveLong ? shirt : skin, sleeveLong ? line : p.skinLine, sleeveLong ? p.shirtDark : p.skinDark);
    if (!sleeveLong) block(ctx, x, y, w, 5, shirt, line, p.shirtDark);
    block(ctx, x, y + 11, w, 3, skin, p.skinLine, p.skinDark);
};

const drawHead = (ctx: Ctx, p: Palette, g: Geometry, dy: number, pose: Pose) => {
    const { x, w, h } = g.head;
    const y = g.head.y + dy;
    block(ctx, x, y, w, h, p.skin, p.skinLine, p.skinDark, 3);
    const eye = '#1b1b1b';
    const eyeH = pose.blink ? 1 : 3;
    const eyeY = y + 9 + (pose.blink ? 2 : 0);
    switch (g.face) {
        case 'front':
            rect(ctx, x + 5, eyeY, 2, eyeH, eye);
            rect(ctx, x + w - 7, eyeY, 2, eyeH, eye);
            rect(ctx, x + 3, y + 13, 3, 1, '#f4a3a3');
            rect(ctx, x + w - 6, y + 13, 3, 1, '#f4a3a3');
            rect(ctx, x + 8, y + 15, 4, 1, p.skinLine);
            break;
        case 'front34':
            rect(ctx, x + 9, eyeY, 2, eyeH, eye);
            rect(ctx, x + 15, eyeY, 2, eyeH, eye);
            rect(ctx, x + 7, y + 13, 3, 1, '#f4a3a3');
            rect(ctx, x + 12, y + 15, 3, 1, p.skinLine);
            // ear on the far side
            block(ctx, x + 2, y + 9, 3, 5, p.skin, p.skinLine, p.skinDark);
            break;
        case 'side':
            rect(ctx, x + w - 5, eyeY, 2, eyeH, eye);
            rect(ctx, x + w, y + 11, 1, 3, p.skinLine);
            rect(ctx, x + w - 1, y + 11, 1, 3, p.skin);
            rect(ctx, x + w - 4, y + 15, 2, 1, p.skinLine);
            block(ctx, x + 6, y + 9, 4, 5, p.skin, p.skinLine, p.skinDark);
            break;
        default:
            break;
    }
};

/** Hats that cover the top of the head hide spikes and buns. */
const COVERING_HATS = ['cap', 'beanie', 'party', 'gradcap'];

const drawHair = (ctx: Ctx, look: AvatarLook, p: Palette, g: Geometry, view: View, dy: number) => {
    const covered = COVERING_HATS.includes(look.hat);
    const style = covered && (look.hairStyle === 'spiky' || look.hairStyle === 'bun') ? 'short' : look.hairStyle;
    if (style === 'bald') return;
    const { x, w, h } = g.head;
    const y = g.head.y + dy;
    const hair = (hx: number, hy: number, hw: number, hh: number) => block(ctx, hx, hy, hw, hh, p.hair, p.hairDark, p.hairDark);
    const back = view === 'back' || view === 'back34';

    // The main cap of hair.
    if (back) {
        hair(x - 1, y - 2, w + 2, h - 3);
        if (view === 'back34') rect(ctx, x + w - 5, y + h - 8, 4, 4, p.skin); // ear peeking out
    } else if (view === 'side') {
        hair(x - 1, y - 2, w + 1, 8);
        hair(x - 1, y + 4, 8, 10); // back of the head is on the left
    } else if (view === 'front34') {
        hair(x - 1, y - 2, w + 2, 8);
        hair(x - 1, y + 4, 5, 9);
    } else {
        hair(x - 1, y - 2, w + 2, 8);
        hair(x - 1, y + 4, 3, 7);
        hair(x + w - 2, y + 4, 3, 7);
    }

    switch (style) {
        case 'long':
            if (back) hair(x - 1, y + 8, w + 2, h + 4);
            else if (view === 'side' || view === 'front34') hair(x - 2, y + 4, 8, h + 6);
            else {
                hair(x - 2, y + 4, 4, h + 5);
                hair(x + w - 2, y + 4, 4, h + 5);
            }
            break;
        case 'spiky':
            for (let i = 0; i < 5; i++) hair(x + 1 + i * 4, y - 5 - (i % 2) * 2, 4, 5);
            break;
        case 'bun':
            hair(view === 'side' || view === 'front34' ? x : x + w / 2 - 4, y - 8, 9, 8);
            break;
        case 'curly':
            for (let i = 0; i < 5; i++) hair(x - 2 + i * 5, y - 4 + (i % 2), 6, 6);
            if (!back) {
                hair(x - 3, y + 3, 5, 9);
                if (view === 'front') hair(x + w - 2, y + 3, 5, 9);
            }
            break;
        case 'pigtails':
            if (view === 'front' || view === 'back') {
                hair(x - 5, y + 7, 6, 8);
                hair(x + w - 1, y + 7, 6, 8);
            } else {
                hair(x - 5, y + 7, 6, 8);
            }
            break;
        default:
            break;
    }
};

const drawHat = (ctx: Ctx, hat: string, p: Palette, g: Geometry, view: View, dy: number) => {
    const { x, w } = g.head;
    const y = g.head.y + dy;
    const facingRight = view === 'side' || view === 'front34' || view === 'back34';
    const back = view === 'back' || view === 'back34';
    switch (hat) {
        case 'cap':
            block(ctx, x - 1, y - 4, w + 2, 9, p.hat, p.hatDark, p.hatDark, 2);
            if (view === 'front') rect(ctx, x + 2, y + 4, w - 4, 2, p.hatDark);
            else if (facingRight && !back) block(ctx, x + w - 5, y + 3, 9, 3, p.hatDark, p.hatDark, p.hatDark);
            break;
        case 'beanie': // bandana
            block(ctx, x - 1, y - 1, w + 2, 7, p.hat, p.hatDark, p.hatDark, 1);
            if (view !== 'front') block(ctx, x - 4, y + 2, 5, 5, p.hat, p.hatDark, p.hatDark);
            rect(ctx, x + 2, y + 1, 2, 2, '#ffffff');
            rect(ctx, x + w - 6, y + 2, 2, 2, '#ffffff');
            break;
        case 'bow': // headband
            rect(ctx, x - 1, y + 3, w + 2, 2, p.hat);
            block(ctx, view === 'front' ? x + w - 7 : x + 1, y - 1, 8, 5, p.hat, p.hatDark, p.hatDark);
            break;
        case 'party': { // holiday hat
            for (let i = 0; i < 7; i++) rect(ctx, x + 2 + i, y - 2 - i * 2, w - 4 - i * 2, 2, i % 2 ? p.hatDark : p.hat);
            rect(ctx, x - 1, y - 1, w + 2, 4, '#ffffff');
            rect(ctx, x + w / 2 - 2, y - 18, 4, 4, '#ffffff');
            break;
        }
        case 'headphones': // sunglasses
            if (view === 'front') rect(ctx, x + 3, y + 8, w - 6, 3, '#111111');
            else if (view === 'front34') rect(ctx, x + 7, y + 8, w - 8, 3, '#111111');
            else if (view === 'side') {
                rect(ctx, x + w - 7, y + 8, 7, 3, '#111111');
                rect(ctx, x + 8, y + 9, w - 14, 1, '#111111');
            }
            break;
        case 'gradcap': // top hat
            block(ctx, x + 2, y - 13, w - 4, 14, '#1b1b1b', '#000000', '#000000');
            rect(ctx, x + 3, y - 4, w - 6, 2, p.hat);
            rect(ctx, x - 2, y, w + 4, 2, '#000000');
            break;
        case 'crown':
            block(ctx, x + 1, y - 3, w - 2, 5, '#ffc300', '#8a6400', '#e0a800');
            for (let i = 0; i < 3; i++) block(ctx, x + 2 + i * ((w - 7) / 2), y - 7, 3, 5, '#ffc300', '#8a6400', '#e0a800');
            rect(ctx, x + w / 2 - 1, y - 1, 2, 2, '#e63946');
            break;
        default:
            break;
    }
};

/** Draws one frame of a figure, unmirrored (the caller mirrors w/nw/sw). */
const drawFigure = (ctx: Ctx, look: AvatarLook, view: View, pose: Pose) => {
    const p = paletteFor(look);
    const g = GEOMETRY[view];
    const walking = pose.kind === 'walk';
    const bob = walking && pose.frame % 2 === 1 ? -1 : 0;
    const drop = pose.kind === 'sit' ? 7 : pose.kind === 'floor' ? 13 : 0;
    const top = TORSO_TOP + bob + drop;
    const headDy = bob + drop;
    const swing = walking ? (pose.frame === 0 ? 2 : pose.frame === 2 ? -2 : 0) : 0;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(10, FEET_Y - 1, 20, 3);
    ctx.fillRect(12, FEET_Y - 2, 16, 1);
    ctx.fillRect(12, FEET_Y + 2, 16, 1);

    if (g.armFar !== null && g.farArmBehind) {
        drawArm(ctx, look, p, g.armFar, top, view === 'side' ? g.armW : 3, -swing, pose.bothArmsUp, true);
    }
    drawLegs(ctx, look, p, g, view, pose, drop);
    drawTorso(ctx, look, p, g, view, top);
    if (g.armFar !== null && !g.farArmBehind) {
        drawArm(ctx, look, p, g.armFar, top, g.armW, -swing, pose.bothArmsUp, false);
    }
    const nearUp = pose.nearArmUp || pose.bothArmsUp;
    if (!nearUp) drawArm(ctx, look, p, g.armNear, top, g.armW, swing, false, false);
    drawHead(ctx, p, g, headDy, pose);
    drawHair(ctx, look, p, g, view, headDy);
    drawHat(ctx, look.hat, p, g, view, headDy);
    if (nearUp) drawArm(ctx, look, p, g.armNear, top, g.armW, 0, true, false);
};

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
        drawFigure(canvas.getContext('2d')!, look, view, pose);
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
