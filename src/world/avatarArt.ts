import { AvatarLook } from './types';

/**
 * Draws EduVerse avatars as pixel art in the style of the Liberated Pixel Cup sprites we used
 * before: a dark outline around every part, soft shading from a light at the top left, hair
 * with strands and a jagged fringe, and big shiny eyes. Unlike those sprites, these are drawn
 * in code, so every look works in every direction.
 *
 * Each part is painted as a flat shape into a buffer; a shading pass then picks each pixel's
 * shade from where it sits inside its part (edge, lit side, shadow side), and the colors come
 * from ramps shaped like the LPC ones.
 *
 * This file has no Pixi code so it can run anywhere with a buffer.
 */

export type View = 'front' | 'front34' | 'side' | 'back34' | 'back';
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

export const FRAME_W = 44;
export const FRAME_H = 72;
/** Where the feet touch the floor inside a frame. */
export const FEET_Y = 69;
/** How far the body drops when sitting on a chair or on the floor. */
export const SIT_DROP = 7;
export const FLOOR_DROP = 13;
/** How far the top of the head (hair included) is above the feet, when standing. */
export const HEAD_TOP = FEET_Y - 14;

const CX = 22;
const HEAD_Y = 16;
const TORSO_TOP = 36;
const TORSO_H = 16;
const LEG_TOP = 50;

// ---- colors ----

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHex = ([r, g, b]: RGB) => `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;

const rgbToHsl = ([r, g, b]: RGB): RGB => {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
    return [h / 6, s, l];
};

const hslToRgb = ([h, s, l]: RGB): RGB => {
    if (s === 0) return [l, l, l].map((v) => Math.round(v * 255)) as RGB;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const channel = (t: number) => {
        let x = t;
        if (x < 0) x += 1;
        if (x > 1) x -= 1;
        if (x < 1 / 6) return p + (q - p) * 6 * x;
        if (x < 1 / 2) return q;
        if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
        return p;
    };
    return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)].map((v) => Math.round(v * 255)) as RGB;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Moves hue `h` toward `target` (both 0-1) by up to `amount`. */
const hueToward = (h: number, target: number, amount: number) => {
    let d = target - h;
    if (d > 0.5) d -= 1;
    if (d < -0.5) d += 1;
    const step = Math.sign(d) * Math.min(Math.abs(d), amount);
    return (h + step + 1) % 1;
};

/** The LPC ramps (outline, deep shadow, shadow, base, light, highlight) our ramps copy. */
const LPC_SKIN = ['#271920', '#99423c', '#cc8665', '#e4a47c', '#f9d5ba', '#faece7'];
const LPC_HAIR = ['#260d14', '#6a1108', '#a42600', '#bf4000', '#e55600', '#ff8a00'];
const LPC_CLOTH = ['#281820', '#4d4a5d', '#958080', '#c4b59f', '#e5e6c7', '#ffffff'];

export type Ramp = string[];

/**
 * A six-shade ramp around `base`, with the same steps of light and dark as an LPC ramp.
 * Shadows lean toward purple and lights toward yellow, like hand-picked pixel-art ramps.
 * The outline is a very dark shade of the base color.
 */
const rampFor = (source: string[], base: string, strength = 1): Ramp => {
    const src = source.map((c) => rgbToHsl(hexToRgb(c)));
    const [h, s, l] = rgbToHsl(hexToRgb(base));
    const ref = src[3][2];
    return src.map(([, , sl], i) => {
        if (i === 0) {
            const outline = hslToRgb([hueToward(h, 0.8, 0.1), Math.min(0.45, s * 0.6 + 0.1), clamp(l * 0.18, 0.06, 0.13)]);
            return rgbToHex(outline);
        }
        const dl = (sl - ref) * strength;
        const hue = i < 3 ? hueToward(h, 0.72, 0.035 * (3 - i)) : i > 3 ? hueToward(h, 0.15, 0.03 * (i - 3)) : h;
        const sat = i < 3 ? clamp(s + 0.02, 0, 1) : i > 3 ? clamp(s - 0.05, 0, 1) : s;
        return rgbToHex(hslToRgb([hue, sat, clamp(l + dl, 0.05, 0.97)]));
    });
};

interface Palette {
    skin: Ramp;
    hair: Ramp;
    shirt: Ramp;
    pants: Ramp;
    shoes: Ramp;
    hat: Ramp;
    white: Ramp;
    black: Ramp;
    gold: Ramp;
    navy: Ramp;
    blush: string;
    eye: Ramp;
}

const paletteFor = (look: AvatarLook): Palette => {
    const [sr, sg, sb] = hexToRgb(look.skin);
    return {
        skin: rampFor(LPC_SKIN, look.skin),
        hair: rampFor(LPC_HAIR, look.hair, 1.4),
        shirt: rampFor(LPC_CLOTH, look.shirt, 0.55),
        pants: rampFor(LPC_CLOTH, look.pants, 0.5),
        shoes: rampFor(LPC_CLOTH, look.shoes, 0.5),
        hat: rampFor(LPC_CLOTH, look.hatColor, 0.55),
        white: rampFor(LPC_CLOTH, '#eeeeee', 0.45),
        black: rampFor(LPC_CLOTH, '#222226', 0.3),
        gold: rampFor(LPC_HAIR, '#f2b705', 1),
        navy: rampFor(LPC_CLOTH, '#223a66', 0.5),
        blush: rgbToHex([Math.round(sr * 0.75 + 240 * 0.25), Math.round(sg * 0.75 + 110 * 0.25), Math.round(sb * 0.75 + 120 * 0.25)]),
        eye: ['#1b1622', '#1d2a4d', '#2c4a80', '#3f6fb0', '#8fb8e8', '#ffffff'],
    };
};

// ---- the paint buffer ----

interface Part {
    ramp: Ramp;
    /** Draw a dark line where this part overlaps parts drawn before it. */
    line: boolean;
}

/** Shade indexes into a ramp. */
const OUTLINE = 0;
const DEEP = 1;
const SHADE = 2;
const BASE = 3;
const LIGHT = 4;
const SHINE = 5;

class Paint {
    readonly part: Int16Array;
    readonly tone: Int8Array;
    readonly fixed: (string | null)[];
    readonly parts: Part[] = [];

    constructor(readonly w: number, readonly h: number) {
        this.part = new Int16Array(w * h).fill(-1);
        this.tone = new Int8Array(w * h).fill(-1);
        this.fixed = new Array(w * h).fill(null);
    }

    newPart(ramp: Ramp, line = true) {
        this.parts.push({ ramp, line });
        return this.parts.length - 1;
    }

    inside(x: number, y: number) {
        return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }

    set(p: number, x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        if (!this.inside(x, y)) return;
        const i = y * this.w + x;
        this.part[i] = p;
        this.tone[i] = -1;
        this.fixed[i] = null;
    }

    rect(p: number, x: number, y: number, w: number, h: number) {
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) this.set(p, x + xx, y + yy);
    }

    /** One run of pixels per row: [start x offset, width]. */
    spans(p: number, x: number, y: number, rows: [number, number][]) {
        rows.forEach(([dx, w], row) => this.rect(p, x + dx, y + row, w, 1));
    }

    /** Rows of the given widths centered on x = cx (between two pixels when cx is whole). */
    centered(p: number, cx: number, y: number, widths: number[]) {
        widths.forEach((w, row) => this.rect(p, Math.round(cx - w / 2), y + row, w, 1));
    }

    /** A rounded box. */
    box(p: number, x: number, y: number, w: number, h: number, r = 1) {
        for (let row = 0; row < h; row++) {
            const fromEdge = Math.min(row, h - 1 - row);
            const cut = fromEdge < r ? r - fromEdge : 0;
            this.rect(p, x + cut, y + row, w - cut * 2, 1);
        }
    }

    /** A limb of width w from (x1, y1) to (x2, y2), one run per row. */
    limb(p: number, x1: number, y1: number, x2: number, y2: number, w: number) {
        const rows = Math.max(1, y2 - y1);
        for (let row = 0; row <= rows; row++) {
            const cx = x1 + ((x2 - x1) * row) / rows;
            this.rect(p, Math.round(cx - w / 2), y1 + row, w, 1);
        }
    }

    /** Forces a shade of whatever part is at (x, y). */
    shade(x: number, y: number, tone: number) {
        if (!this.inside(x, y)) return;
        const i = y * this.w + x;
        if (this.part[i] >= 0) this.tone[i] = tone;
    }

    /** Paints a fixed color over a part (eyes and small details). */
    color(x: number, y: number, color: string) {
        if (!this.inside(x, y)) return;
        const i = y * this.w + x;
        if (this.part[i] >= 0) this.fixed[i] = color;
    }

    partAt(x: number, y: number) {
        return this.inside(x, y) ? this.part[y * this.w + x] : -1;
    }

    /** How many pixels of part p there are from (x, y) going (dx, dy), up to `max`. */
    run(p: number, x: number, y: number, dx: number, dy: number, max = 6) {
        let n = 0;
        while (n < max && this.partAt(x + dx * n, y + dy * n) === p) n++;
        return n;
    }

    /** Turns parts into colors (RGBA). */
    render(): Uint8ClampedArray {
        const out = new Uint8ClampedArray(this.w * this.h * 4);
        const cache = new Map<string, RGB>();
        const rgb = (hex: string) => {
            let c = cache.get(hex);
            if (!c) {
                c = hexToRgb(hex);
                cache.set(hex, c);
            }
            return c;
        };
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                const i = y * this.w + x;
                const p = this.part[i];
                if (p < 0) continue;
                const part = this.parts[p];
                let color = this.fixed[i];
                if (!color) {
                    let tone = this.tone[i];
                    if (tone < 0) tone = this.autoTone(p, part, x, y);
                    color = part.ramp[tone];
                }
                const [r, g, b] = rgb(color);
                out[i * 4] = r;
                out[i * 4 + 1] = g;
                out[i * 4 + 2] = b;
                out[i * 4 + 3] = 255;
            }
        }
        return out;
    }

    private autoTone(p: number, part: Part, x: number, y: number) {
        const around = [this.partAt(x - 1, y), this.partAt(x + 1, y), this.partAt(x, y - 1), this.partAt(x, y + 1)];
        if (around.some((q) => q < 0)) return OUTLINE;
        if (part.line && around.some((q) => q !== p && q < p)) return OUTLINE;
        const left = this.run(p, x, y, -1, 0);
        const right = this.run(p, x, y, 1, 0);
        const up = this.run(p, x, y, 0, -1);
        const down = this.run(p, x, y, 0, 1);
        const width = left + right - 1;
        const height = up + down - 1;
        // Neighbouring parts in front still cast a soft edge.
        const nextToFront = around.some((q) => q !== p && q > p);
        if (down === 1 || right === 1 || nextToFront) return SHADE;
        if (width >= 9 && right <= 3) return SHADE;
        if (height >= 12 && down <= 3) return SHADE;
        if (up === 1 || left === 1) return LIGHT;
        return BASE;
    }
}

// ---- figure layout per view ----

interface Layout {
    /** Head box (20 x 20). */
    headX: number;
    /** Torso center. */
    torsoCx: number;
    /** Torso widths from the shoulders down. */
    torso: number[];
    /** Arm x (left edge) nearest the viewer, and the far arm; null when the far arm is hidden. */
    armNear: number;
    armFar: number | null;
    farArmBehind: boolean;
    /** Leg x (left edge) of the far and near leg. */
    legs: [number, number];
    face: 'front' | 'front34' | 'side' | 'none';
}

const FRONT_TORSO = [12, 16, 18, 18, 18, 17, 17, 16, 16, 16, 16, 16, 16, 16, 16, 16];
const TORSO_34 = [10, 14, 16, 16, 16, 15, 15, 14, 14, 14, 14, 14, 14, 14, 14, 14];
const SIDE_TORSO = [6, 9, 10, 11, 11, 11, 11, 10, 10, 10, 10, 10, 10, 10, 10, 10];

const LAYOUT: Record<View, Layout> = {
    front: { headX: CX - 10, torsoCx: CX, torso: FRONT_TORSO, armNear: CX + 8, armFar: CX - 12, farArmBehind: false, legs: [CX - 7, CX + 1], face: 'front' },
    front34: { headX: CX - 9, torsoCx: CX + 1, torso: TORSO_34, armNear: CX + 6, armFar: CX - 8, farArmBehind: true, legs: [CX - 5, CX + 1], face: 'front34' },
    side: { headX: CX - 10, torsoCx: CX, torso: SIDE_TORSO, armNear: CX - 2, armFar: CX - 1, farArmBehind: true, legs: [CX - 3, CX - 2], face: 'side' },
    back34: { headX: CX - 11, torsoCx: CX - 1, torso: TORSO_34, armNear: CX - 11, armFar: CX + 5, farArmBehind: true, legs: [CX - 1, CX - 6], face: 'none' },
    back: { headX: CX - 10, torsoCx: CX, torso: FRONT_TORSO, armNear: CX + 8, armFar: CX - 12, farArmBehind: false, legs: [CX - 7, CX + 1], face: 'none' },
};

/** Head outlines, one [x offset, width] per row, inside a 20 x 20 box. */
const HEAD_SHAPE: Record<'front' | 'front34' | 'side', [number, number][]> = {
    front: [[6, 8], [4, 12], [3, 14], [2, 16], [1, 18], [1, 18], [0, 20], [0, 20], [0, 20], [0, 20], [0, 20], [0, 20], [0, 20], [0, 20], [1, 18], [1, 18], [2, 16], [3, 14], [4, 12], [6, 8]],
    front34: [[6, 8], [4, 12], [3, 14], [2, 16], [1, 18], [1, 18], [0, 20], [0, 20], [0, 20], [0, 20], [0, 20], [0, 20], [0, 20], [0, 20], [1, 19], [1, 18], [2, 17], [4, 14], [6, 11], [8, 7]],
    side: [[5, 8], [3, 12], [2, 14], [1, 16], [1, 17], [0, 19], [0, 19], [0, 19], [0, 19], [0, 19], [0, 20], [0, 21], [0, 20], [1, 19], [1, 19], [2, 18], [4, 16], [6, 14], [8, 11], [11, 6]],
};

const headShapeFor = (view: View) => (view === 'side' ? HEAD_SHAPE.side : view === 'front34' ? HEAD_SHAPE.front34 : HEAD_SHAPE.front);

// ---- parts ----

interface Ctx {
    paint: Paint;
    look: AvatarLook;
    pal: Palette;
    view: View;
    lay: Layout;
    pose: Pose;
    /** Vertical offset of the upper body (bobbing and sitting). */
    dy: number;
    drop: number;
}

const back = (view: View) => view === 'back' || view === 'back34';
const turned = (view: View) => view === 'front34' || view === 'side' || view === 'back34';

const legRamps = (c: Ctx) => {
    const dress = c.look.top === 'dress';
    const pants = c.look.bottom === 'pants' && !dress;
    return { leg: pants ? c.pal.pants : c.pal.skin, shorts: c.look.bottom === 'shorts' && !dress };
};

/** One leg: from the hip to the ankle, with a shoe at the end pointing `toe` px forward. */
const drawLeg = (c: Ctx, hipX: number, hipY: number, ankleX: number, ankleY: number, toe: number) => {
    const { paint, pal } = c;
    const { leg, shorts } = legRamps(c);
    const w = 6;
    const p = paint.newPart(leg);
    paint.limb(p, hipX + w / 2, hipY, ankleX + w / 2, ankleY - 2, w);
    if (shorts) {
        const s = paint.newPart(pal.pants);
        paint.limb(s, hipX + w / 2, hipY, hipX + w / 2 + (ankleX - hipX) * 0.35, hipY + 6, w + 1);
    }
    const shoe = paint.newPart(pal.shoes);
    const sx = ankleX + Math.min(0, toe);
    paint.box(shoe, sx - (toe === 0 ? 0 : 0), ankleY - 3, w + Math.abs(toe), 4, 1);
    // a lit toe cap
    paint.shade(toe >= 0 ? sx + w + toe - 3 : sx + 1, ankleY - 2, LIGHT);
};

const drawLegs = (c: Ctx) => {
    const { view, lay, pose, drop } = c;
    const [farX, nearX] = lay.legs;
    const hipY = LEG_TOP + drop;

    if (pose.kind === 'sit' || pose.kind === 'floor') {
        const floor = pose.kind === 'floor';
        if (view === 'front' || view === 'back') {
            // Facing toward or away from us: the knees stick out and the shins hang down.
            for (const x of [farX, nearX]) {
                if (floor) {
                    const { leg } = legRamps(c);
                    const k = c.paint.newPart(leg);
                    c.paint.box(k, x, hipY, 6, FEET_Y - hipY - 2, 1);
                    const shoe = c.paint.newPart(c.pal.shoes);
                    c.paint.box(shoe, x, FEET_Y - 4, 6, 4, 1);
                } else {
                    drawLeg(c, x, hipY, x, FEET_Y, 0);
                    const { leg } = legRamps(c);
                    const knee = c.paint.newPart(leg);
                    c.paint.box(knee, x, hipY, 6, 5, 1);
                }
            }
            return;
        }
        // Turned: thighs point the way the figure faces (right in the unmirrored frame).
        const reach = floor ? 13 : 9;
        const legs = view === 'side' ? [nearX] : [farX + 1, nearX];
        legs.forEach((x, i) => {
            const { leg, shorts } = legRamps(c);
            const lift = view === 'side' ? 0 : i === 0 ? -1 : 1;
            const thigh = c.paint.newPart(leg);
            c.paint.box(thigh, x, hipY + lift, reach + 3, 6, 1);
            if (shorts) {
                const s = c.paint.newPart(c.pal.pants);
                c.paint.box(s, x, hipY + lift, 7, 6, 1);
            }
            const shoe = c.paint.newPart(c.pal.shoes);
            if (floor) {
                c.paint.box(shoe, x + reach + 1, hipY + lift - 2, 4, 7, 1);
            } else {
                const shin = c.paint.newPart(leg);
                c.paint.rect(shin, x + reach - 3, hipY + lift + 4, 6, FEET_Y - (hipY + lift + 4) - 2);
                c.paint.box(shoe, x + reach - 3, FEET_Y - 4 + Math.max(0, lift), 9, 4, 1);
            }
        });
        return;
    }

    const f = pose.kind === 'walk' ? pose.frame : -1;
    if (view === 'side') {
        // One leg forward and one back, passing each other on frames 1 and 3.
        const stride = f === 0 ? 4 : f === 2 ? -4 : 0;
        drawLeg(c, farX, hipY, farX - stride, FEET_Y - (f === 3 ? 1 : 0), 3);
        drawLeg(c, nearX, hipY, nearX + stride, FEET_Y - (f === 1 ? 1 : 0), 3);
        return;
    }
    if (turned(view)) {
        // Three-quarter views stride along the diagonal: forward is right and toward us.
        const s = f === 0 ? 1 : f === 2 ? -1 : 0;
        const toward = view === 'front34' ? 1 : -1;
        drawLeg(c, farX, hipY, farX - s * 2, FEET_Y - 1 - s * toward - (f === 3 ? 1 : 0), 2);
        drawLeg(c, nearX, hipY, nearX + s * 2, FEET_Y + s * toward - (f === 1 ? 1 : 0), 2);
        return;
    }
    // Facing toward or away from us: the stepping leg lifts.
    drawLeg(c, farX, hipY, farX, FEET_Y - (f === 0 ? 2 : 0), 0);
    drawLeg(c, nearX, hipY, nearX, FEET_Y - (f === 2 ? 2 : 0), 0);
};

const drawNeck = (c: Ctx) => {
    const p = c.paint.newPart(c.pal.skin);
    const x = c.view === 'side' ? CX - 3 : c.lay.torsoCx - 3;
    c.paint.rect(p, x, TORSO_TOP - 3 + c.dy, 6, 4);
};

const drawTorso = (c: Ctx) => {
    const { paint, look, pal, view, lay, dy } = c;
    const top = TORSO_TOP + dy;
    const cx = lay.torsoCx;
    const facing = view === 'front' || view === 'front34';
    const centerX = view === 'front34' ? cx + 2 : cx;

    if (look.top === 'dress' || look.bottom === 'skirt') {
        const skirt = paint.newPart(look.top === 'dress' ? pal.shirt : pal.pants);
        const base = lay.torso[lay.torso.length - 1];
        const widths = [base, base + 1, base + 2, base + 3, base + 3, base + 4, base + 5, base + 5, base + 6];
        paint.centered(skirt, cx, top + TORSO_H - 3, widths);
        // pleats
        for (let i = 3; i < widths.length - 1; i++) {
            for (let k = -1; k <= 1; k++) paint.shade(Math.round(cx + k * (base / 3)), top + TORSO_H - 3 + i, SHADE);
        }
    }

    const shirt = paint.newPart(pal.shirt);
    paint.centered(shirt, cx, top, lay.torso);
    // A fold under the chest and at the waist.
    const halfWaist = lay.torso[lay.torso.length - 1] / 2;
    if (look.top !== 'dress' && look.bottom !== 'skirt') {
        const band = paint.newPart(pal.pants);
        paint.rect(band, Math.round(cx - halfWaist), top + TORSO_H - 2, Math.round(halfWaist * 2), 2);
        if (look.bottom !== 'shorts' || true) paint.shade(Math.round(centerX) - 1, top + TORSO_H - 2, LIGHT);
    }

    const neckline = () => {
        // a little shadow of the chin
        if (!facing) return;
        const n = paint.newPart(pal.skin);
        paint.centered(n, centerX, top, view === 'front' ? [6, 4] : [5, 3]);
    };

    switch (look.top) {
        case 'uniform': {
            if (!facing) {
                const collar = paint.newPart(pal.white);
                paint.centered(collar, cx, top, [lay.torso[0] - 2]);
                break;
            }
            const collar = paint.newPart(pal.white);
            paint.centered(collar, centerX, top, [8, 6, 2]);
            const tie = paint.newPart(pal.navy);
            paint.centered(tie, centerX, top + 1, [2, 2, 3, 3, 3, 3, 3, 2]);
            break;
        }
        case 'hoodie': {
            // cardigan: open at the front over a white shirt, with buttons
            if (!facing) break;
            const inner = paint.newPart(pal.white);
            paint.centered(inner, centerX, top, [6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
            neckline();
            for (const by of [4, 8, 12]) paint.shade(Math.round(centerX) - 3, top + by, DEEP);
            break;
        }
        case 'jersey': {
            // V-neck
            if (!facing) break;
            const v = paint.newPart(pal.skin);
            paint.centered(v, centerX, top, [6, 4, 2]);
            break;
        }
        case 'dress':
            neckline();
            break;
        default:
            neckline();
            break;
    }
};

/** An arm hanging from the shoulder at (x, top), swinging `swing` px (forward is +). */
const drawArm = (c: Ctx, x: number, swing: number, up: boolean, far: boolean) => {
    const { paint, look, pal, view } = c;
    const top = TORSO_TOP + c.dy;
    const longSleeve = look.top === 'longsleeve' || look.top === 'hoodie';
    const dim = (r: Ramp) => [r[0], r[1], r[2], r[2], r[3], r[4]];
    const skinRamp = far ? dim(pal.skin) : pal.skin;
    const shirtRamp = far ? dim(pal.shirt) : pal.shirt;
    const w = 4;
    const cx = x + w / 2;

    if (up) {
        const arm = paint.newPart(longSleeve ? shirtRamp : skinRamp);
        paint.limb(arm, cx, top - 12, cx, top + 2, w);
        const hand = longSleeve ? paint.newPart(skinRamp) : arm;
        paint.box(hand, x, top - 16, w + 1, 5, 1);
        if (!longSleeve) {
            const sleeve = paint.newPart(shirtRamp);
            paint.box(sleeve, x - 1, top, w + 2, 4, 1);
        }
        return;
    }

    const sideways = view === 'side' || turned(view);
    const handX = sideways ? cx + swing : cx;
    const lift = sideways ? Math.abs(swing) > 2 ? 1 : 0 : Math.max(0, swing);
    const arm = paint.newPart(longSleeve ? shirtRamp : skinRamp);
    paint.limb(arm, cx, top + 1, handX, top + 12 - lift, w);
    const hand = longSleeve ? paint.newPart(skinRamp) : arm;
    paint.box(hand, Math.round(handX - w / 2), top + 11 - lift, w, 4, 1);
    if (!longSleeve) {
        const sleeve = paint.newPart(shirtRamp);
        paint.limb(sleeve, cx, top + 1, cx + (handX - cx) * 0.35, top + 5, w + 1);
    }
};

const drawHead = (c: Ctx) => {
    const { paint, pal, view, lay, pose } = c;
    const x = lay.headX;
    const y = HEAD_Y + c.dy;
    const head = paint.newPart(pal.skin);
    paint.spans(head, x, y, headShapeFor(view));

    const ear = (ex: number) => {
        const e = paint.newPart(pal.skin);
        paint.box(e, ex, y + 9, 3, 5, 1);
        paint.shade(ex + 1, y + 11, SHADE);
    };

    const eye = (ex: number, ey: number, wide: boolean) => {
        const e = pal.eye;
        if (pose.blink) {
            for (let i = 0; i < (wide ? 3 : 2); i++) paint.color(ex + i - (wide ? 1 : 0), ey + 2, e[0]);
            return;
        }
        // lash
        for (let i = -1; i < 2; i++) paint.color(ex + i, ey, e[0]);
        // iris with a shine
        paint.color(ex, ey + 1, e[5]);
        paint.color(ex + 1, ey + 1, e[3]);
        paint.color(ex, ey + 2, e[2]);
        paint.color(ex + 1, ey + 2, e[1]);
        if (wide) {
            paint.color(ex - 1, ey + 1, '#f4f1ea');
            paint.color(ex - 1, ey + 2, '#d9d3ca');
        }
    };

    switch (lay.face) {
        case 'front':
            eye(x + 5, y + 9, true);
            eye(x + 14, y + 9, false);
            paint.color(x + 13, y + 10, '#f4f1ea');
            paint.color(x + 13, y + 11, '#d9d3ca');
            paint.shade(x + 10, y + 13, SHADE);
            paint.shade(x + 9, y + 15, SHADE);
            paint.shade(x + 10, y + 15, SHADE);
            paint.color(x + 3, y + 13, pal.blush);
            paint.color(x + 4, y + 13, pal.blush);
            paint.color(x + 15, y + 13, pal.blush);
            paint.color(x + 16, y + 13, pal.blush);
            break;
        case 'front34':
            ear(x + 2);
            eye(x + 9, y + 9, true);
            eye(x + 16, y + 9, false);
            paint.color(x + 15, y + 10, '#f4f1ea');
            paint.color(x + 15, y + 11, '#d9d3ca');
            paint.shade(x + 18, y + 13, SHADE);
            paint.shade(x + 14, y + 15, SHADE);
            paint.shade(x + 15, y + 15, SHADE);
            paint.color(x + 7, y + 13, pal.blush);
            paint.color(x + 8, y + 13, pal.blush);
            break;
        case 'side':
            ear(x + 7);
            eye(x + 16, y + 9, false);
            paint.color(x + 15, y + 10, '#f4f1ea');
            paint.color(x + 15, y + 11, '#d9d3ca');
            paint.shade(x + 18, y + 15, SHADE);
            paint.color(x + 13, y + 13, pal.blush);
            paint.color(x + 14, y + 13, pal.blush);
            break;
        default:
            if (view === 'back34') ear(x + 15);
            else {
                ear(x - 1);
                ear(x + 18);
            }
            break;
    }
};

/** Hats that cover the top of the head hide spikes and buns. */
const COVERING_HATS = ['cap', 'beanie', 'party', 'gradcap'];

/** Hair strands: darker lines running down, and a shine at the top left. */
const strands = (paint: Paint, p: number, x0: number, y0: number, w: number, h: number, shineX: number, shineY: number) => {
    for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
            if (paint.partAt(x, y) !== p) continue;
            if ((x * 3 + Math.floor((y - y0) / 3)) % 5 === 0) paint.shade(x, y, SHADE);
        }
    }
    for (let i = 0; i < 4; i++) {
        paint.shade(shineX + i, shineY + (i > 1 ? 1 : 0), SHINE);
        paint.shade(shineX + i, shineY + 1 + (i > 1 ? 1 : 0), LIGHT);
    }
};

/** Hair that hangs behind the body; drawn before the torso when facing us. */
const drawHairBack = (c: Ctx) => {
    const { paint, look, pal, view, lay } = c;
    const covered = COVERING_HATS.includes(look.hat);
    const x = lay.headX;
    const y = HEAD_Y + c.dy;
    if (look.hairStyle === 'long' && (view === 'front' || view === 'front34')) {
        const p = paint.newPart(pal.hair);
        paint.box(p, x - 1, y + 6, 22, 21, 2);
        strands(paint, p, x - 1, y + 6, 22, 21, x + 30, y);
    }
    if (look.hairStyle === 'bun' && !covered && (view === 'front' || view === 'front34')) {
        const p = paint.newPart(pal.hair);
        paint.box(p, x + (view === 'front' ? 6 : 1), y - 6, 9, 8, 2);
    }
};

const drawHair = (c: Ctx) => {
    const { paint, look, pal, view, lay } = c;
    const covered = COVERING_HATS.includes(look.hat);
    const style = covered && (look.hairStyle === 'spiky' || look.hairStyle === 'bun') ? 'short' : look.hairStyle;
    if (style === 'bald') return;
    const x = lay.headX;
    const y = HEAD_Y + c.dy;
    const hair = pal.hair;

    // Extras that sit behind the main cap.
    if (style === 'bun' && (view === 'side' || back(view))) {
        const b = paint.newPart(hair);
        paint.box(b, view === 'side' ? x - 1 : x + 5, y - 6, 10, 9, 2);
        paint.shade(view === 'side' ? x + 1 : x + 7, y - 4, SHINE);
    }
    if (style === 'pigtails') {
        const tail = (tx: number) => {
            const t = paint.newPart(hair);
            paint.spans(t, tx, y + 6, [[1, 4], [0, 6], [0, 6], [0, 7], [0, 7], [1, 6], [1, 6], [2, 4], [2, 3]]);
            strands(paint, t, tx, y + 6, 7, 9, tx + 1, y + 7);
        };
        if (view === 'front' || view === 'back') {
            tail(x - 6);
            tail(x + 20);
        } else if (view === 'side' || view === 'back34') {
            tail(x - 5);
        } else {
            tail(x - 5);
            tail(x + 19);
        }
    }

    const p = paint.newPart(hair);
    if (back(view)) {
        // The back of the head.
        paint.spans(p, x, y - 2, [[5, 10], [3, 14], [1, 18], [0, 20], [-1, 22], [-1, 22], [-1, 22], [-1, 22], [-1, 22], [-1, 22], [-1, 22], [-1, 22], [0, 20], [0, 20], [1, 18], [2, 16], [3, 14]]);
        if (view === 'back34') {
            // the far side of the face peeks out on the right
            paint.spans(p, x + 16, y + 9, [[0, 1], [0, 1], [0, 1]]);
        }
        strands(paint, p, x - 1, y - 2, 22, 18, x + 3, y - 1);
    } else if (view === 'side') {
        // Round at the back (left), a fringe over the forehead (right).
        paint.spans(p, x, y - 2, [[4, 10], [2, 15], [1, 17], [0, 19], [-1, 21], [-1, 21], [-1, 20], [-1, 19], [-1, 11], [-1, 10], [-1, 9], [-1, 9], [0, 8], [0, 8], [0, 8], [1, 7], [2, 6], [3, 5]]);
        // sideburn in front of the ear
        paint.rect(p, x + 10, y + 7, 2, 4);
        // fringe tips
        paint.set(p, x + 18, y + 6);
        paint.set(p, x + 15, y + 6);
        strands(paint, p, x - 1, y - 2, 21, 16, x + 5, y - 1);
    } else if (view === 'front34') {
        paint.spans(p, x, y - 2, [[5, 10], [3, 14], [1, 18], [0, 20], [-1, 22], [-1, 22], [-1, 22], [-1, 22], [-1, 7], [-1, 5], [-1, 4], [-1, 4], [-1, 4], [0, 3]]);
        // jagged fringe
        for (const [fx, len] of [[5, 2], [8, 3], [11, 2], [14, 3], [17, 2], [19, 1]] as [number, number][]) {
            paint.rect(p, x + fx, y + 6, 2, len - 1);
            paint.set(p, x + fx + 1, y + 5 + len);
        }
        strands(paint, p, x - 1, y - 2, 22, 16, x + 4, y - 1);
    } else {
        paint.spans(p, x, y - 2, [[5, 10], [3, 14], [1, 18], [0, 20], [-1, 22], [-1, 22], [-1, 22], [-1, 22], [-1, 22], [-1, 4], [-1, 4], [-1, 3], [-1, 3], [-1, 3]]);
        paint.spans(p, x + 18, y + 7, [[0, 3], [0, 3], [0, 3], [1, 2], [1, 2]]);
        // jagged fringe
        for (const [fx, len] of [[3, 1], [6, 2], [9, 0], [11, 2], [14, 1]] as [number, number][]) {
            paint.rect(p, x + fx, y + 7, 2, len);
            if (len) paint.set(p, x + fx + 1, y + 7 + len);
        }
        strands(paint, p, x - 1, y - 2, 22, 16, x + 3, y - 1);
    }

    switch (style) {
        case 'long': {
            if (view === 'front' || view === 'front34') {
                // locks falling in front of the shoulders
                const l = paint.newPart(hair);
                paint.spans(l, x - 2, y + 6, Array.from({ length: 16 }, (_, i) => [0, i > 13 ? 3 : 4] as [number, number]));
                if (view === 'front') paint.spans(l, x + 18, y + 6, Array.from({ length: 16 }, (_, i) => [i > 13 ? 1 : 0, i > 13 ? 3 : 4] as [number, number]));
                strands(paint, l, x - 2, y + 6, 24, 16, x - 1, y + 7);
            } else {
                const l = paint.newPart(hair);
                const lx = view === 'side' ? x - 2 : x - 2;
                const lw = view === 'side' ? 11 : 24;
                paint.box(l, lx, y + 6, lw, 20, 2);
                strands(paint, l, lx, y + 6, lw, 20, lx + 2, y + 7);
            }
            break;
        }
        case 'spiky': {
            const s = paint.newPart(hair);
            for (let i = 0; i < 5; i++) {
                const sx = x + 1 + i * 4;
                const tall = i % 2 === 0 ? 6 : 4;
                for (let row = 0; row < tall; row++) {
                    const w = Math.max(1, Math.round(((row + 1) / tall) * 4));
                    paint.rect(s, sx + Math.floor((4 - w) / 2), y - 1 - tall + row, w, 1);
                }
            }
            paint.rect(s, x + 1, y - 2, 19, 2);
            strands(paint, s, x, y - 8, 22, 8, x + 3, y - 3);
            break;
        }
        case 'curly': {
            const s = paint.newPart(hair);
            for (let i = 0; i < 6; i++) paint.box(s, x - 3 + i * 4, y - 4 + (i % 2), 6, 6, 2);
            if (!back(view)) {
                paint.box(s, x - 4, y + 3, 6, 11, 2);
                if (view === 'front') paint.box(s, x + 18, y + 3, 6, 11, 2);
            } else {
                paint.box(s, x - 4, y + 3, 28, 12, 3);
            }
            for (let i = 0; i < 6; i++) {
                paint.shade(x - 1 + i * 4, y - 3 + (i % 2), SHINE);
                paint.shade(x + 1 + i * 4, y + (i % 2), SHADE);
            }
            break;
        }
        case 'bun':
            if (view === 'front34') {
                const b = paint.newPart(hair);
                paint.box(b, x + 1, y - 6, 9, 8, 2);
                paint.shade(x + 3, y - 4, SHINE);
            }
            break;
        default:
            break;
    }
};

const drawHat = (c: Ctx) => {
    const { paint, look, pal, view, lay } = c;
    const x = lay.headX;
    const y = HEAD_Y + c.dy;
    const w = 20;
    const isBack = back(view);
    const faceRight = turned(view) && !isBack;
    switch (look.hat) {
        case 'cap': {
            const p = paint.newPart(pal.hat);
            paint.box(p, x - 1, y - 4, w + 2, 10, 3);
            paint.shade(x + 3, y - 2, SHINE);
            if (view === 'front') {
                const brim = paint.newPart(pal.hat);
                paint.box(brim, x + 1, y + 4, w - 2, 3, 1);
            } else if (faceRight) {
                const brim = paint.newPart(pal.hat);
                paint.box(brim, x + w - 6, y + 4, 10, 3, 1);
            }
            const button = paint.newPart(pal.hat);
            paint.rect(button, x + w / 2 - 1, y - 5, 2, 1);
            break;
        }
        case 'beanie': { // bandana
            const p = paint.newPart(pal.hat);
            paint.box(p, x - 1, y - 2, w + 2, 8, 2);
            if (view !== 'front') {
                paint.box(p, x - 5, y + 2, 6, 6, 1);
            }
            for (const [dx, dy] of [[3, 1], [9, 0], [15, 2], [6, 4], [12, 3]]) paint.color(x + dx, y + dy, pal.white[4]);
            break;
        }
        case 'bow': { // headband with a bow
            const band = paint.newPart(pal.hat);
            paint.rect(band, x - 1, y + 2, w + 2, 2);
            const bow = paint.newPart(pal.hat);
            const bx = view === 'front' ? x + w - 8 : isBack ? x + 2 : x + 1;
            paint.spans(bow, bx, y - 2, [[0, 3], [0, 4], [0, 9], [0, 4], [0, 3]]);
            paint.spans(bow, bx + 5, y - 2, [[1, 3], [0, 4], [0, 4], [0, 4], [1, 3]]);
            paint.shade(bx + 4, y, SHINE);
            break;
        }
        case 'party': { // holiday hat
            const p = paint.newPart(pal.hat);
            paint.centered(p, x + w / 2, y - 16, [2, 4, 4, 6, 6, 8, 8, 10, 10, 12, 12, 14, 14, 16, 16, 18]);
            const trim = paint.newPart(pal.white);
            paint.box(trim, x - 2, y - 2, w + 4, 5, 2);
            const pom = paint.newPart(pal.white);
            paint.box(pom, x + w / 2 - 3, y - 20, 6, 5, 2);
            break;
        }
        case 'headphones': { // sunglasses
            const p = paint.newPart(pal.black);
            if (view === 'front') {
                paint.box(p, x + 2, y + 8, 7, 4, 1);
                paint.box(p, x + 11, y + 8, 7, 4, 1);
                paint.rect(p, x + 8, y + 9, 4, 1);
                paint.shade(x + 3, y + 9, SHINE);
                paint.shade(x + 12, y + 9, SHINE);
            } else if (view === 'front34') {
                paint.box(p, x + 7, y + 8, 5, 4, 1);
                paint.box(p, x + 13, y + 8, 6, 4, 1);
                paint.rect(p, x + 3, y + 9, 5, 1);
                paint.shade(x + 14, y + 9, SHINE);
            } else if (view === 'side') {
                paint.box(p, x + 14, y + 8, 6, 4, 1);
                paint.rect(p, x + 8, y + 9, 7, 1);
                paint.shade(x + 15, y + 9, SHINE);
            }
            break;
        }
        case 'gradcap': { // top hat
            const p = paint.newPart(pal.black);
            paint.box(p, x + 3, y - 14, w - 6, 14, 1);
            paint.shade(x + 5, y - 12, LIGHT);
            paint.shade(x + 5, y - 11, LIGHT);
            const band = paint.newPart(pal.hat);
            paint.rect(band, x + 3, y - 5, w - 6, 3);
            const brim = paint.newPart(pal.black);
            paint.box(brim, x - 2, y - 2, w + 4, 3, 1);
            break;
        }
        case 'crown': {
            const p = paint.newPart(pal.gold);
            paint.rect(p, x + 2, y - 4, w - 4, 5);
            for (let i = 0; i < 3; i++) {
                const px = x + 2 + i * 6;
                paint.centered(p, px + 2, y - 8, [1, 2, 3, 4]);
            }
            paint.color(x + w / 2 - 1, y - 2, '#e63946');
            paint.color(x + w / 2, y - 2, '#b0222f');
            paint.shade(x + 3, y - 3, SHINE);
            break;
        }
        default:
            break;
    }
};

const drawShadow = (out: Uint8ClampedArray) => {
    // A soft oval under the feet, only where nothing else is drawn.
    const rows: [number, number][] = [[-8, 16], [-11, 22], [-11, 22], [-8, 16]];
    rows.forEach(([dx, w], i) => {
        const y = FEET_Y - 2 + i;
        for (let x = CX + dx; x < CX + dx + w; x++) {
            const k = (y * FRAME_W + x) * 4;
            if (x < 0 || x >= FRAME_W || y >= FRAME_H || out[k + 3] > 0) continue;
            out[k + 3] = 56;
        }
    });
};

/** Draws one frame, unmirrored (w, nw and sw are mirror images of e, ne and se). Returns RGBA pixels. */
export const renderFigure = (look: AvatarLook, view: View, pose: Pose): Uint8ClampedArray => {
    const paint = new Paint(FRAME_W, FRAME_H);
    const walking = pose.kind === 'walk';
    const bob = walking && pose.frame % 2 === 1 ? -1 : 0;
    const drop = pose.kind === 'sit' ? SIT_DROP : pose.kind === 'floor' ? FLOOR_DROP : 0;
    const c: Ctx = { paint, look, pal: paletteFor(look), view, lay: LAYOUT[view], pose, dy: bob + drop, drop };
    const swing = walking ? (pose.frame === 0 ? 3 : pose.frame === 2 ? -3 : 0) : 0;
    const nearUp = pose.nearArmUp || pose.bothArmsUp;
    const lay = c.lay;

    drawHairBack(c);
    if (lay.armFar !== null && lay.farArmBehind) drawArm(c, lay.armFar, -swing, pose.bothArmsUp, true);
    drawLegs(c);
    drawNeck(c);
    drawTorso(c);
    if (lay.armFar !== null && !lay.farArmBehind) drawArm(c, lay.armFar, -swing, pose.bothArmsUp, false);
    if (!nearUp) drawArm(c, lay.armNear, swing, false, false);
    drawHead(c);
    drawHair(c);
    drawHat(c);
    if (nearUp) drawArm(c, lay.armNear, 0, true, false);

    const out = paint.render();
    drawShadow(out);
    return out;
};
