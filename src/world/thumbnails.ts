import { Application, Container, DisplayObject } from 'pixi.js';
import { drawFurni } from './furni';
import { portrait } from './pixelAvatar';
import { AvatarLook } from './types';

// One hidden renderer draws every furni thumbnail; results are cached as data URLs.
let renderer: Application | null = null;
const cache = new Map<string, string>();

const render = async (key: string, build: () => DisplayObject) => {
    const cached = cache.get(key);
    if (cached) return cached;
    renderer ??= new Application({ width: 8, height: 8, backgroundAlpha: 0, antialias: true });
    const object = build();
    const url = await Promise.resolve(renderer.renderer.extract.base64(object as Container));
    object.destroy({ children: true });
    cache.set(key, url);
    return url;
};

/** Image of a furni type, as it looks placed on a tile. */
export const furniThumbnail = (type: string) =>
    render(`furni:${type}`, () => {
        const container = new Container();
        container.sortableChildren = true;
        container.addChild(...drawFurni({ id: 'thumb', type, x: 0, y: 0, dir: type === 'tv' || type === 'arcade' ? 'sw' : 'se' }));
        return container;
    });

/** Front view of an avatar wearing a look (crisp pixel art, cropped to the character). */
export const avatarThumbnail = (look: AvatarLook) => {
    const key = `avatar:${JSON.stringify(look)}`;
    const cached = cache.get(key);
    if (cached) return Promise.resolve(cached);
    const url = portrait(look, 3);
    cache.set(key, url);
    return Promise.resolve(url);
};
