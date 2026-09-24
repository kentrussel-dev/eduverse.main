import { BaseTexture, Rectangle, SCALE_MODES, Texture } from 'pixi.js';
import { AvatarLook, Dir } from './types';

/**
 * Avatars are built from Liberated Pixel Cup (LPC) sprite sheets in public/avatar/lpc
 * (credits in public/avatar/lpc/CREDITS.md). Each part is one sheet per animation with
 * 64x64 frames and one row per direction; parts are recolored to the player's colors
 * and stacked into one sheet per look.
 */

export type Anim = 'walk' | 'sit' | 'idle';

interface PartInfo {
    /** The part's source shades, darkest first; null when the part keeps its own colors. */
    ramp: string[] | null;
    /** Which AvatarLook color this part takes. */
    recolor: keyof AvatarLook | null;
    /** Stacking order. */
    z: number;
}

interface Manifest {
    frameSize: number;
    animations: Record<Anim, number>;
    parts: Record<string, PartInfo>;
}

const BASE = `${process.env.PUBLIC_URL ?? ''}/avatar/lpc`;
export const FRAME = 64;
export const ANIM_FRAMES: Record<Anim, number> = { walk: 9, sit: 3, idle: 2 };

/** Sheet rows are up, left, down, right. Each of our four facings gets its own row. */
export const ROW_FOR_DIR: Record<Dir, number> = { nw: 0, sw: 1, se: 2, ne: 3 };

let manifestPromise: Promise<Manifest> | null = null;
const images = new Map<string, Promise<HTMLImageElement>>();
const sheets = new Map<string, Promise<HTMLCanvasElement>>();

const loadManifest = () => {
    manifestPromise ??= fetch(`${BASE}/manifest.json`).then((r) => r.json());
    return manifestPromise;
};

const loadImage = (url: string) => {
    let promise = images.get(url);
    if (!promise) {
        promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Could not load ${url}`));
            img.src = url;
        });
        images.set(url, promise);
    }
    return promise;
};

// ---- color helpers ----

const hexToRgb = (hex: string) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHsl = ([r, g, b]: number[]) => {
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

const hslToRgb = ([h, s, l]: number[]) => {
    if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
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
    return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)].map((v) => Math.round(v * 255));
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Builds a shade ramp for `target` shaped like the part's source ramp: the same steps of
 * light and dark around the target color. The darkest shade (the outline) is kept as is.
 */
const rampFor = (source: string[], target: string) => {
    const src = source.map((c) => rgbToHsl(hexToRgb(c)));
    const [th, ts, tl] = rgbToHsl(hexToRgb(target));
    const ref = src[Math.min(3, src.length - 1)][2];
    return src.map(([, , l], i) => {
        if (i === 0) return hexToRgb(source[0]);
        return hslToRgb([th, ts, clamp(tl + (l - ref), 0.04, 0.97)]);
    });
};

const recolor = (img: HTMLImageElement, source: string[], target: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const from = source.map(hexToRgb);
    const to = rampFor(source, target);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] === 0) continue;
        for (let k = 0; k < from.length; k++) {
            const [r, g, b] = from[k];
            if (Math.abs(px[i] - r) <= 1 && Math.abs(px[i + 1] - g) <= 1 && Math.abs(px[i + 2] - b) <= 1) {
                [px[i], px[i + 1], px[i + 2]] = to[k];
                break;
            }
        }
    }
    ctx.putImageData(data, 0, 0);
    return canvas;
};

/** The sprite parts that make up a look, bottom to top. */
const partsFor = (look: AvatarLook, manifest: Manifest) => {
    const keys = ['body', 'head', 'shoes'];
    // A dress is a top plus a matching skirt.
    keys.push(look.top === 'dress' ? 'bottom/skirt' : `bottom/${look.bottom}`);
    keys.push(`top/${look.top}`);
    if (look.hairStyle !== 'bald') keys.push(`hair/${look.hairStyle}`);
    if (look.hat !== 'none') keys.push(`hat/${look.hat}`);
    return keys
        .filter((k) => manifest.parts[k])
        .sort((a, b) => manifest.parts[a].z - manifest.parts[b].z);
};

/** One composed sheet (all directions and frames) for a look and animation. */
export const composeSheet = (look: AvatarLook, anim: Anim) => {
    const key = `${anim}:${JSON.stringify(look)}`;
    let promise = sheets.get(key);
    if (!promise) {
        promise = (async () => {
            const manifest = await loadManifest();
            const parts = partsFor(look, manifest);
            const layers = await Promise.all(parts.map(async (part) => {
                const img = await loadImage(`${BASE}/${part}/${anim}.png`);
                const info = manifest.parts[part];
                if (!info.ramp || !info.recolor) return img;
                const color = part === 'bottom/skirt' && look.top === 'dress' ? look.shirt : look[info.recolor];
                return recolor(img, info.ramp, color);
            }));
            const canvas = document.createElement('canvas');
            canvas.width = FRAME * ANIM_FRAMES[anim];
            canvas.height = FRAME * 4;
            const ctx = canvas.getContext('2d')!;
            layers.forEach((layer) => ctx.drawImage(layer, 0, 0));
            return canvas;
        })();
        sheets.set(key, promise);
        promise.catch(() => sheets.delete(key));
    }
    return promise;
};

export type FrameSet = Record<Anim, Texture[][]>;

/** Pixi textures for every frame of a look: frames[anim][row][column]. */
export const loadFrames = async (look: AvatarLook): Promise<FrameSet> => {
    const result = {} as FrameSet;
    for (const anim of Object.keys(ANIM_FRAMES) as Anim[]) {
        const canvas = await composeSheet(look, anim);
        const base = BaseTexture.from(canvas, { scaleMode: SCALE_MODES.NEAREST });
        result[anim] = [0, 1, 2, 3].map((row) =>
            Array.from({ length: ANIM_FRAMES[anim] }, (_, col) =>
                new Texture(base, new Rectangle(col * FRAME, row * FRAME, FRAME, FRAME))));
    }
    return result;
};

/** A front-facing picture of a look, cropped to the character, as a data URL. */
export const portrait = async (look: AvatarLook, scale = 2) => {
    const sheet = await composeSheet(look, 'walk');
    const frame = document.createElement('canvas');
    frame.width = FRAME;
    frame.height = FRAME;
    const fctx = frame.getContext('2d')!;
    fctx.drawImage(sheet, 0, ROW_FOR_DIR.se * FRAME, FRAME, FRAME, 0, 0, FRAME, FRAME);
    // Crop to the visible pixels.
    const { data } = fctx.getImageData(0, 0, FRAME, FRAME);
    let [x0, y0, x1, y1] = [FRAME, FRAME, 0, 0];
    for (let y = 0; y < FRAME; y++) {
        for (let x = 0; x < FRAME; x++) {
            if (data[(y * FRAME + x) * 4 + 3] > 0) {
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
    octx.drawImage(frame, x0, y0, w, h, 0, 0, w * scale, h * scale);
    return out.toDataURL();
};
