import { BaseTexture, Rectangle, SCALE_MODES, Sprite, Texture } from 'pixi.js';
import { project } from './iso';
import { Dir, FurniItem } from './types';

/**
 * Furniture rendered from the CC0 Kenney Furniture Kit and KayKit Furniture/Restaurant Bits
 * 3D models (licenses in public/furni). Each piece was rendered from the four isometric
 * directions into public/furni/<type>.png; manifest.json says where each direction's frame
 * is and where the tile center (on the floor) sits in it.
 */
export interface FurniAsset {
    /** Footprint [w, d] in tiles when facing sw/ne (swapped for se/nw). */
    size?: [number, number];
    name: string;
    category: string;
    seat: boolean;
    /** Flat pieces (rugs) that people walk over and other furniture stands on. */
    walk: boolean;
    /** Per direction: [x, width, height, anchorX, anchorY] inside the strip. */
    frames: Record<Dir, [number, number, number, number, number]>;
}

const BASE = `${process.env.PUBLIC_URL ?? ''}/furni`;
let manifest: Record<string, FurniAsset> = {};
let loading: Promise<void> | null = null;

/** Loads the furniture list once; call before drawing a room. */
export const loadFurniAssets = () => {
    loading ??= fetch(`${BASE}/manifest.json`)
        .then((r) => r.json())
        .then((m) => {
            manifest = m;
        })
        .catch(() => {
            loading = null;
        });
    return loading ?? Promise.resolve();
};

export const furniAsset = (type: string): FurniAsset | undefined => manifest[type];

/** Width (along x) and depth (along y) in tiles of a piece facing dir. */
export const footprintSize = (type: string, dir: Dir): [number, number] => {
    const [w, d] = manifest[type]?.size ?? [1, 1];
    return dir === 'se' || dir === 'nw' ? [d, w] : [w, d];
};

/** The tiles a piece covers; (x, y) is its back corner. */
export const footprint = (type: string, x: number, y: number, dir: Dir) => {
    const [w, d] = footprintSize(type, dir);
    const tiles: [number, number][] = [];
    for (let dx = 0; dx < w; dx += 1) for (let dy = 0; dy < d; dy += 1) tiles.push([x + dx, y + dy]);
    return tiles;
};

const bases = new Map<string, BaseTexture>();
const textures = new Map<string, Texture>();

const frameTexture = (type: string, dir: Dir) => {
    const key = `${type}:${dir}`;
    let texture = textures.get(key);
    if (!texture) {
        let base = bases.get(type);
        if (!base) {
            base = BaseTexture.from(`${BASE}/${type}.png`, { scaleMode: SCALE_MODES.NEAREST });
            bases.set(type, base);
        }
        const [x, w, h] = manifest[type].frames[dir];
        texture = new Texture(base, new Rectangle(x, 0, w, h));
        textures.set(key, texture);
    }
    return texture;
};

/** A sprite for a kit piece standing on its tile, or null if the type isn't a kit piece. */
export const furniSprite = (item: FurniItem): Sprite | null => {
    const asset = manifest[item.type];
    if (!asset) return null;
    const dir = asset.frames[item.dir] ? item.dir : 'se';
    const [, w, h, ax, ay] = asset.frames[dir];
    const sprite = new Sprite(frameTexture(item.type, dir));
    sprite.anchor.set(ax / w, ay / h);
    const [fw, fd] = footprintSize(item.type, dir);
    const center = project(item.x + fw / 2, item.y + fd / 2);
    sprite.position.set(center.x, center.y);
    return sprite;
};

/** A picture of a kit piece for the shop and inventory. */
export const furniAssetImage = (type: string, dir: Dir = 'se') =>
    new Promise<string>((resolve, reject) => {
        const asset = manifest[type];
        if (!asset) {
            reject(new Error(`Unknown furni ${type}`));
            return;
        }
        const [x, w, h] = asset.frames[dir];
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d')!.drawImage(img, x, 0, w, h, 0, 0, w, h);
            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
        img.src = `${BASE}/${type}.png`;
    });
