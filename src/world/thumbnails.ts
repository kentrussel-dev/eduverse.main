import { Application, Container, DisplayObject, Graphics } from 'pixi.js';
import { drawAvatar, idlePose } from './avatar';
import { drawFurni } from './furni';
import { AvatarLook } from './types';

// One hidden renderer draws every thumbnail; results are cached as data URLs.
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

/** Front view of an avatar wearing a look. */
export const avatarThumbnail = (look: AvatarLook) =>
    render(`avatar:${JSON.stringify(look)}`, () => {
        const g = new Graphics();
        drawAvatar(g, look, idlePose('se'));
        g.scale.set(2);
        const container = new Container();
        container.addChild(g);
        return container;
    });
