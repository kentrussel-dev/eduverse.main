import { Container, Graphics, Text } from 'pixi.js';
import { flat, poly, prism, project } from './iso';
import { FurniItem } from './types';

const WOOD = 0xb07a45;
const DARK_WOOD = 0x7a4b28;
const LIGHT_WOOD = 0xd4a373;
const METAL = 0x8a94a6;

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

    const setText = (value: string) => {
        const lines = value.split('\n').slice(0, 4).map((line) => (line.length > 26 ? `${line.slice(0, 25)}…` : line));
        text.text = lines.join('\n');
        // Keep wrapped text inside the board.
        while (text.height > 50 && text.text.length > 0) {
            text.text = text.text.slice(0, -2) + '…';
        }
    };
    return { board, setText };
};
