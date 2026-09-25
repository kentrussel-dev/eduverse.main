import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { furniAsset, furniSprite, footprintSize } from './furniAssets';
import { flat, poly, prism, project } from './iso';
import { FurniItem } from './types';

const WOOD = 0xb07a45;
const DARK_WOOD = 0x7a4b28;
const LIGHT_WOOD = 0xd4a373;
const METAL = 0x8a94a6;

/** Flat pieces other furniture can stand on. */
export const isRug = (type: string) => type === 'rug' || furniAsset(type)?.walk === true;

/** Pieces people sit on. */
export const isSeat = (type: string) => ['chair', 'sofa', 'stool', 'beanbag'].includes(type) || furniAsset(type)?.seat === true;

/** Depth used to sort a piece drawn on tile (x, y); larger is drawn in front. */
export const depthOf = (x: number, y: number, offset = 0) => Math.round((x + y) * 100 + offset);

const legs = (g: Graphics, x: number, y: number, inset: number, height: number, color: number) => {
    const t = 0.07;
    for (const [lx, ly] of [[inset, inset], [1 - inset - t, inset], [inset, 1 - inset - t], [1 - inset - t, 1 - inset - t]]) {
        prism(g, x + lx, x + lx + t, y + ly, y + ly + t, 0, height, color);
    }
};

/** Seat plus backrest. The backrest sits opposite the direction the seat faces. */
const chair = (item: FurniItem, color: number, seatHeight: number, backHeight: number, size: number) => {
    const { x, y } = item;
    const a = 0.5 - size / 2;
    const b = 0.5 + size / 2;
    const seat = new Graphics();
    if (size < 0.8) {
        legs(seat, x, y, a + 0.02, seatHeight, METAL);
    } else {
        prism(seat, x + a, x + b, y + a, y + b, 0, seatHeight - 3, color);
    }
    prism(seat, x + a, x + b, y + a, y + b, seatHeight - 3, seatHeight, color);

    const back = new Graphics();
    const thick = 0.08;
    let backInFront = false;
    switch (item.dir) {
        case 'ne': // faces -y, back on the +y side (toward the viewer)
            prism(back, x + a, x + b, y + b - thick, y + b, seatHeight, seatHeight + backHeight, color);
            backInFront = true;
            break;
        case 'nw': // faces -x, back on the +x side
            prism(back, x + b - thick, x + b, y + a, y + b, seatHeight, seatHeight + backHeight, color);
            backInFront = true;
            break;
        case 'se': // faces +x, back on the -x side
            prism(back, x + a, x + a + thick, y + a, y + b, seatHeight, seatHeight + backHeight, color);
            break;
        default: // 'sw' faces +y, back on the -y side
            prism(back, x + a, x + b, y + a, y + a + thick, seatHeight, seatHeight + backHeight, color);
            break;
    }
    seat.zIndex = depthOf(x, y, 10);
    // A back in front of the seat must cover a seated avatar (avatars use offset 50).
    back.zIndex = depthOf(x, y, backInFront ? 60 : 5);
    return [seat, back];
};

/** Builds the display objects for one piece of furniture (already depth-sorted via zIndex). */
export const drawFurni = (item: FurniItem): Container[] => {
    const { x, y } = item;
    const sprite = furniSprite(item);
    if (sprite) {
        // Rugs lie under everything; other pieces sort with people by their tile.
        // Big pieces sort by their front tile so people behind them are hidden correctly.
        const [fw, fd] = footprintSize(item.type, item.dir);
        sprite.zIndex = furniAsset(item.type)?.walk ? depthOf(x, y, -90) : depthOf(x + fw - 1, y + fd - 1, 20);
        return [sprite];
    }
    const g = new Graphics();
    g.zIndex = depthOf(x, y, 20);

    switch (item.type) {
        case 'chair':
            return chair(item, 0x3f7fd9, 16, 22, 0.5);
        case 'stool':
            return chair(item, 0xe07a5f, 18, 0, 0.4);
        case 'sofa':
            return chair(item, 0x9b5de5, 14, 18, 0.9);
        case 'desk':
            legs(g, x, y, 0.1, 22, METAL);
            prism(g, x + 0.08, x + 0.92, y + 0.08, y + 0.92, 22, 26, LIGHT_WOOD);
            // an open notebook
            flat(g, x + 0.3, x + 0.6, y + 0.3, y + 0.55, 26.5, 0xffffff);
            break;
        case 'teacher_desk':
            prism(g, x + 0.04, x + 0.96, y + 0.04, y + 0.96, 0, 28, DARK_WOOD);
            prism(g, x + 0.2, x + 0.5, y + 0.3, y + 0.6, 28, 34, 0xc0392b); // books
            break;
        case 'table':
            legs(g, x, y, 0.12, 22, DARK_WOOD);
            prism(g, x + 0.04, x + 0.96, y + 0.04, y + 0.96, 22, 26, WOOD);
            break;
        case 'computer':
            legs(g, x, y, 0.1, 22, METAL);
            prism(g, x + 0.08, x + 0.92, y + 0.08, y + 0.92, 22, 26, LIGHT_WOOD);
            prism(g, x + 0.3, x + 0.4, y + 0.25, y + 0.75, 26, 50, 0x2b2d42);
            poly(g, 0x4cc9f0, [
                project(x + 0.41, y + 0.3, 47), project(x + 0.41, y + 0.7, 47),
                project(x + 0.41, y + 0.7, 30), project(x + 0.41, y + 0.3, 30),
            ]);
            break;
        case 'bookshelf': {
            const againstX = item.dir === 'se';
            const [x0, x1, y0, y1] = againstX ? [x + 0.05, x + 0.45, y + 0.05, y + 0.95] : [x + 0.05, x + 0.95, y + 0.05, y + 0.45];
            prism(g, x0, x1, y0, y1, 0, 72, DARK_WOOD);
            const bookColors = [0xe63946, 0x457b9d, 0xf4a261, 0x2a9d8f, 0xe9c46a, 0x8d99ae];
            for (let shelf = 0; shelf < 3; shelf++) {
                const z = 8 + shelf * 22;
                for (let i = 0; i < 6; i++) {
                    const s = 0.1 + i * 0.13;
                    const color = bookColors[(i + shelf * 2 + x + y) % bookColors.length];
                    const h = 14 + ((i * 7 + shelf) % 4);
                    const pts = againstX
                        ? [project(x1 + 0.001, y0 + s, z + h), project(x1 + 0.001, y0 + s + 0.1, z + h), project(x1 + 0.001, y0 + s + 0.1, z), project(x1 + 0.001, y0 + s, z)]
                        : [project(x0 + s, y1 + 0.001, z + h), project(x0 + s + 0.1, y1 + 0.001, z + h), project(x0 + s + 0.1, y1 + 0.001, z), project(x0 + s, y1 + 0.001, z)];
                    poly(g, color, pts);
                }
            }
            break;
        }
        case 'locker': {
            const againstX = item.dir === 'se';
            const [x0, x1, y0, y1] = againstX ? [x + 0.05, x + 0.5, y + 0.05, y + 0.95] : [x + 0.05, x + 0.95, y + 0.05, y + 0.5];
            prism(g, x0, x1, y0, y1, 0, 80, 0x5a7d9a);
            break;
        }
        case 'plant': {
            prism(g, x + 0.32, x + 0.68, y + 0.32, y + 0.68, 0, 16, 0xc8553d);
            const c = project(x + 0.5, y + 0.5, 30);
            g.beginFill(0x2d6a4f);
            g.drawEllipse(c.x - 9, c.y + 4, 13, 11);
            g.drawEllipse(c.x + 9, c.y + 4, 13, 11);
            g.endFill();
            g.beginFill(0x40916c);
            g.drawEllipse(c.x, c.y - 8, 14, 13);
            g.endFill();
            break;
        }
        case 'beanbag': {
            const c = project(x + 0.5, y + 0.5, 0);
            g.beginFill(0xf28482);
            g.drawEllipse(c.x, c.y - 7, 22, 12);
            g.endFill();
            g.beginFill(0xf5a3a1);
            g.drawEllipse(c.x - 3, c.y - 11, 13, 6);
            g.endFill();
            g.zIndex = depthOf(x, y, 10);
            break;
        }
        case 'lamp': {
            const c = project(x + 0.5, y + 0.5, 0);
            prism(g, x + 0.38, x + 0.62, y + 0.38, y + 0.62, 0, 4, 0x495057);
            g.beginFill(0x6c757d);
            g.drawRect(c.x - 1.5, c.y - 58, 3, 56);
            g.endFill();
            g.beginFill(0xffe8a3, 0.35);
            g.drawCircle(c.x, c.y - 62, 20);
            g.endFill();
            g.beginFill(0xffd166);
            g.drawPolygon([c.x - 9, c.y - 56, c.x + 9, c.y - 56, c.x + 6, c.y - 70, c.x - 6, c.y - 70]);
            g.endFill();
            break;
        }
        case 'teddy': {
            const c = project(x + 0.5, y + 0.5, 0);
            const fur = 0xa0522d;
            g.beginFill(fur);
            g.drawEllipse(c.x, c.y - 12, 12, 11);
            g.drawCircle(c.x - 9, c.y - 32, 5);
            g.drawCircle(c.x + 9, c.y - 32, 5);
            g.drawCircle(c.x, c.y - 26, 10);
            g.drawEllipse(c.x - 10, c.y - 5, 5, 4);
            g.drawEllipse(c.x + 10, c.y - 5, 5, 4);
            g.endFill();
            g.beginFill(0xdeb887);
            g.drawEllipse(c.x, c.y - 12, 7, 7);
            g.drawEllipse(c.x, c.y - 23, 4.5, 3.5);
            g.endFill();
            g.beginFill(0x1b1b1b);
            g.drawCircle(c.x - 4, c.y - 28, 1.5);
            g.drawCircle(c.x + 4, c.y - 28, 1.5);
            g.drawCircle(c.x, c.y - 24, 1.5);
            g.endFill();
            g.beginFill(0xe63946);
            g.drawPolygon([c.x, c.y - 17, c.x - 6, c.y - 20, c.x - 6, c.y - 14]);
            g.drawPolygon([c.x, c.y - 17, c.x + 6, c.y - 20, c.x + 6, c.y - 14]);
            g.endFill();
            break;
        }
        case 'duck': {
            const c = project(x + 0.5, y + 0.5, 0);
            g.beginFill(0xffd60a);
            g.drawEllipse(c.x, c.y - 5, 9, 6);
            g.drawCircle(c.x + 5, c.y - 13, 5);
            g.endFill();
            g.beginFill(0xf77f00);
            g.drawPolygon([c.x + 9, c.y - 13, c.x + 14, c.y - 12, c.x + 9, c.y - 10]);
            g.endFill();
            g.beginFill(0x1b1b1b);
            g.drawCircle(c.x + 6.5, c.y - 14.5, 1);
            g.endFill();
            break;
        }
        case 'trophy': {
            const c = project(x + 0.5, y + 0.5, 0);
            prism(g, x + 0.3, x + 0.7, y + 0.3, y + 0.7, 0, 10, 0x3d2b1f);
            g.beginFill(0xffc300);
            g.drawRect(c.x - 2, c.y - 24, 4, 12);
            g.drawPolygon([c.x - 11, c.y - 42, c.x + 11, c.y - 42, c.x + 6, c.y - 24, c.x - 6, c.y - 24]);
            g.endFill();
            g.lineStyle(2, 0xffc300);
            g.arc(c.x - 11, c.y - 36, 4, Math.PI / 2, (Math.PI * 3) / 2);
            g.arc(c.x + 11, c.y - 36, 4, -Math.PI / 2, Math.PI / 2);
            g.lineStyle(0);
            g.beginFill(0xffe066);
            g.drawRect(c.x - 7, c.y - 40, 3, 12);
            g.endFill();
            break;
        }
        case 'aquarium': {
            prism(g, x + 0.08, x + 0.92, y + 0.2, y + 0.8, 0, 18, 0x3d2b1f);
            const glass = new Graphics();
            flat(glass, x + 0.1, x + 0.9, y + 0.22, y + 0.78, 18, 0x90e0ef, 0.5);
            poly(glass, 0x48cae4, [project(x + 0.1, y + 0.78, 46), project(x + 0.9, y + 0.78, 46), project(x + 0.9, y + 0.78, 18), project(x + 0.1, y + 0.78, 18)], 0.7);
            poly(glass, 0x0096c7, [project(x + 0.9, y + 0.22, 46), project(x + 0.9, y + 0.78, 46), project(x + 0.9, y + 0.78, 18), project(x + 0.9, y + 0.22, 18)], 0.7);
            const f1 = project(x + 0.4, y + 0.78, 32);
            const f2 = project(x + 0.9, y + 0.5, 26);
            glass.beginFill(0xff7b00);
            glass.drawEllipse(f1.x, f1.y, 4, 2.5);
            glass.drawPolygon([f1.x + 3, f1.y, f1.x + 7, f1.y - 3, f1.x + 7, f1.y + 3]);
            glass.drawEllipse(f2.x, f2.y, 3.5, 2.2);
            glass.endFill();
            glass.beginFill(0x2d6a4f);
            const weed = project(x + 0.25, y + 0.78, 18);
            glass.drawEllipse(weed.x, weed.y - 8, 2, 8);
            glass.endFill();
            g.addChild(glass);
            break;
        }
        case 'tv': {
            prism(g, x + 0.1, x + 0.9, y + 0.25, y + 0.75, 0, 14, DARK_WOOD);
            const screenOnX = item.dir !== 'sw' && item.dir !== 'nw';
            const [x0, x1, y0, y1] = screenOnX ? [x + 0.35, x + 0.55, y + 0.1, y + 0.9] : [x + 0.1, x + 0.9, y + 0.35, y + 0.55];
            prism(g, x0, x1, y0, y1, 14, 44, 0x2b2d42);
            const glow = 0x72efdd;
            if (item.dir === 'se') {
                poly(g, glow, [project(x1 + 0.001, y0 + 0.06, 41), project(x1 + 0.001, y1 - 0.06, 41), project(x1 + 0.001, y1 - 0.06, 17), project(x1 + 0.001, y0 + 0.06, 17)]);
            } else if (item.dir === 'sw') {
                poly(g, glow, [project(x0 + 0.06, y1 + 0.001, 41), project(x1 - 0.06, y1 + 0.001, 41), project(x1 - 0.06, y1 + 0.001, 17), project(x0 + 0.06, y1 + 0.001, 17)]);
            }
            break;
        }
        case 'arcade': {
            prism(g, x + 0.15, x + 0.85, y + 0.15, y + 0.85, 0, 70, 0x7209b7);
            const faceX = item.dir !== 'sw' && item.dir !== 'nw';
            if (item.dir === 'se' || item.dir === 'sw') {
                const p = (u: number, z: number) => (faceX ? project(x + 0.851, y + 0.15 + u * 0.7, z) : project(x + 0.15 + u * 0.7, y + 0.851, z));
                poly(g, 0x111111, [p(0.1, 64), p(0.9, 64), p(0.9, 40), p(0.1, 40)]);
                poly(g, 0x4cc9f0, [p(0.18, 61), p(0.82, 61), p(0.82, 44), p(0.18, 44)]);
                poly(g, 0xf72585, [p(0.1, 36), p(0.9, 36), p(0.9, 30), p(0.1, 30)]);
                const b1 = p(0.3, 33);
                const b2 = p(0.6, 33);
                g.beginFill(0xffd60a);
                g.drawCircle(b1.x, b1.y, 1.8);
                g.drawCircle(b2.x, b2.y, 1.8);
                g.endFill();
            }
            break;
        }
        case 'block_red':
        case 'block_blue':
        case 'block_yellow':
        case 'block_green': {
            const colors: Record<string, number> = { block_red: 0xef476f, block_blue: 0x118ab2, block_yellow: 0xffd166, block_green: 0x06d6a0 };
            prism(g, x + 0.02, x + 0.98, y + 0.02, y + 0.98, 0, 30, colors[item.type]);
            flat(g, x + 0.2, x + 0.8, y + 0.2, y + 0.8, 30.2, 0xffffff, 0.18);
            break;
        }
        case 'rug':
            flat(g, x, x + 1, y, y + 1, 0.5, 0xc1121f, 0.85);
            g.zIndex = depthOf(x, y, -90);
            break;
        default:
            prism(g, x + 0.2, x + 0.8, y + 0.2, y + 0.8, 0, 20, 0x999999);
    }
    return [g];
};

/**
 * The whiteboard hangs on the back wall that runs along y = 0 (it faces "sw").
 * Returns the board and a text object skewed to lie on the wall.
 */
export const drawWhiteboard = (item: FurniItem) => {
    const board = new Container();
    const g = new Graphics();
    const x0 = item.x + 0.1;
    const x1 = item.x + 3.9;
    const y = item.y - 0.001;
    poly(g, 0x6c757d, [project(x0 - 0.06, y, 104), project(x1 + 0.06, y, 104), project(x1 + 0.06, y, 42), project(x0 - 0.06, y, 42)]);
    poly(g, 0xf8f9fa, [project(x0, y, 100), project(x1, y, 100), project(x1, y, 46), project(x0, y, 46)]);
    poly(g, 0x495057, [project(x0 + 0.3, y, 44), project(x1 - 0.3, y, 44), project(x1 - 0.3, y, 40), project(x0 + 0.3, y, 40)]);
    board.addChild(g);

    const text = new Text('', {
        fontFamily: 'Comic Sans MS, Chalkboard SE, sans-serif',
        fontSize: 9,
        fill: 0x1d3557,
        wordWrap: true,
        wordWrapWidth: 116,
        lineHeight: 11,
    });
    const origin = project(x0 + 0.08, y, 97);
    text.position.set(origin.x, origin.y);
    // Along the y = 0 wall, moving +x goes 32px right and 16px down: slope 0.5.
    text.skew.set(0, Math.atan(0.5));
    board.addChild(text);

    // A picture of the drawing board, skewed onto the wall like the text; it covers the text.
    const picture = new Sprite(Texture.EMPTY);
    const corner = project(x0 + 0.04, y, 99);
    picture.position.set(corner.x, corner.y);
    picture.skew.set(0, Math.atan(0.5));
    picture.visible = false;
    board.addChild(picture);
    const setPicture = (dataUrl: string) => {
        if (!dataUrl) {
            picture.visible = false;
            text.visible = true;
            return;
        }
        const texture = Texture.from(dataUrl);
        const fit = () => {
            // Keep the drawing's shape inside the board (3.8 tiles wide, 51px tall).
            const maxW = (x1 - x0 - 0.08) * 32;
            const maxH = 51;
            const scale = Math.min(maxW / texture.width, maxH / texture.height);
            picture.texture = texture;
            picture.width = texture.width * scale;
            picture.height = texture.height * scale;
            picture.visible = true;
            text.visible = false;
        };
        if (texture.baseTexture.valid) fit();
        else texture.baseTexture.once('loaded', fit);
    };

    const setText = (value: string) => {
        const lines = value.split('\n').slice(0, 4).map((line) => (line.length > 26 ? `${line.slice(0, 25)}…` : line));
        text.text = lines.join('\n');
        // Keep wrapped text inside the board.
        while (text.height > 50 && text.text.length > 0) {
            text.text = text.text.slice(0, -2) + '…';
        }
    };
    return { board, setText, setPicture };
};
