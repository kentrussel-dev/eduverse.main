import { Application, Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { AvatarSprite } from './avatar';
import { depthOf, drawFurni, drawWhiteboard } from './furni';
import { dirFromStep, flat, poly, project, screenToTile, shade, tileCenter } from './iso';
import { ChatMessage, Dir, FurniItem, Occupant, RoomSnapshot } from './types';

/** Must match Occupant.StepSeconds on the server. */
const STEP_SECONDS = 0.45;
const WALL_HEIGHT = 120;
const BUBBLE_LIFETIME = 9000;

interface Walker {
    sprite: AvatarSprite;
    x: number;
    y: number;
    queue: [number, number][];
    from: [number, number];
    to: [number, number] | null;
    progress: number;
    dir: Dir;
}

interface Bubble {
    view: Container;
    born: number;
    height: number;
}

export interface RoomSceneEvents {
    onTileClick: (x: number, y: number) => void;
    onAvatarClick: (occupantId: string) => void;
}

/** Draws a room with PixiJS and animates everyone in it. React owns the UI around it. */
export class RoomScene {
    private app: Application;
    private world = new Container();
    private entities = new Container();
    private bubbles = new Container();
    private hover = new Graphics();
    private walkers = new Map<string, Walker>();
    private bubbleList: Bubble[] = [];
    private floor = new Set<string>();
    private seats = new Map<string, FurniItem>();
    private setWhiteboardText: ((text: string) => void) | null = null;
    private dragStart: { x: number; y: number; worldX: number; worldY: number } | null = null;
    private dragged = false;

    constructor(private host: HTMLElement, private room: RoomSnapshot, private events: RoomSceneEvents) {
        this.app = new Application({
            resizeTo: host,
            backgroundColor: 0x0d1b2a,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });
        host.appendChild(this.app.view as HTMLCanvasElement);

        this.entities.sortableChildren = true;
        this.world.addChild(this.buildRoomShell(), this.hover, this.entities, this.bubbles);
        this.app.stage.addChild(this.world);

        for (const item of room.furni) {
            if (item.type === 'whiteboard') {
                const { board, setText } = drawWhiteboard(item);
                this.world.addChildAt(board, 1);
                this.setWhiteboardText = setText;
            } else {
                this.entities.addChild(...drawFurni(item));
            }
            if (['chair', 'sofa', 'stool'].includes(item.type)) {
                this.seats.set(`${item.x},${item.y}`, item);
            }
        }
        this.setWhiteboardText?.(room.whiteboard);

        for (const occupant of room.occupants) {
            this.addOccupant(occupant);
        }

        this.setupInput();
        this.centerCamera();
        this.app.ticker.add(this.tick);

        if (process.env.REACT_APP_E2E === 'true') {
            // Lets browser tests click exact tiles.
            (window as any).eduverseScene = this;
        }
    }

    /** Page coordinates of a tile's center, relative to the canvas. */
    tileToCanvas(x: number, y: number) {
        return this.world.toGlobal(tileCenter(x, y));
    }

    destroy() {
        this.app.ticker.remove(this.tick);
        this.app.destroy(true, { children: true });
    }

    // ---- room shell: floor and walls ----

    private isFloor = (x: number, y: number) => this.floor.has(`${x},${y}`);

    private buildRoomShell() {
        const g = new Graphics();
        const { layout, doorX, doorY } = this.room;
        layout.forEach((row, y) => [...row].forEach((c, x) => c !== 'x' && this.floor.add(`${x},${y}`)));

        const wallLeft = 0xb8c0d9;
        const wallRight = 0x9aa3c2;
        const tiles = [...this.floor].map((key) => key.split(',').map(Number));

        // Back walls: a tile with nothing behind it gets a wall on that edge (except the door).
        for (const [x, y] of tiles) {
            const isDoor = x === doorX && y === doorY;
            if (!this.isFloor(x - 1, y)) {
                if (isDoor) {
                    poly(g, 0x1b263b, [project(x, y + 0.15, 0), project(x, y + 0.85, 0), project(x, y + 0.85, 78), project(x, y + 0.15, 78)]);
                    poly(g, wallLeft, [project(x, y, WALL_HEIGHT), project(x, y + 1, WALL_HEIGHT), project(x, y + 0.85, 78), project(x, y + 0.15, 78)]);
                    poly(g, wallLeft, [project(x, y, 0), project(x, y + 0.15, 0), project(x, y + 0.15, WALL_HEIGHT), project(x, y, WALL_HEIGHT)]);
                    poly(g, wallLeft, [project(x, y + 0.85, 0), project(x, y + 1, 0), project(x, y + 1, WALL_HEIGHT), project(x, y + 0.85, WALL_HEIGHT)]);
                } else {
                    poly(g, wallLeft, [project(x, y, 0), project(x, y + 1, 0), project(x, y + 1, WALL_HEIGHT), project(x, y, WALL_HEIGHT)]);
                }
                poly(g, shade(wallLeft, 30), [project(x, y, WALL_HEIGHT), project(x, y + 1, WALL_HEIGHT), project(x - 0.15, y + 1, WALL_HEIGHT), project(x - 0.15, y, WALL_HEIGHT)]);
            }
            if (!this.isFloor(x, y - 1)) {
                poly(g, wallRight, [project(x, y, 0), project(x + 1, y, 0), project(x + 1, y, WALL_HEIGHT), project(x, y, WALL_HEIGHT)]);
                poly(g, shade(wallRight, 45), [project(x, y, WALL_HEIGHT), project(x + 1, y, WALL_HEIGHT), project(x + 1, y - 0.15, WALL_HEIGHT), project(x, y - 0.15, WALL_HEIGHT)]);
            }
        }

        // Floor, with a visible edge on the front sides.
        for (const [x, y] of tiles) {
            const color = (x + y) % 2 === 0 ? 0xc9a47a : 0xbf9a70;
            if (!this.isFloor(x, y + 1)) {
                poly(g, 0x6b4f33, [project(x, y + 1, 0), project(x + 1, y + 1, 0), project(x + 1, y + 1, -8), project(x, y + 1, -8)]);
            }
            if (!this.isFloor(x + 1, y)) {
                poly(g, 0x553d27, [project(x + 1, y, 0), project(x + 1, y + 1, 0), project(x + 1, y + 1, -8), project(x + 1, y, -8)]);
            }
            flat(g, x, x + 1, y, y + 1, 0, color);
            g.lineStyle(1, 0x000000, 0.08);
            g.drawPolygon([project(x, y).x, project(x, y).y, project(x + 1, y).x, project(x + 1, y).y,
                project(x + 1, y + 1).x, project(x + 1, y + 1).y, project(x, y + 1).x, project(x, y + 1).y]);
            g.lineStyle(0);
        }
        return g;
    }

    /** Fits the whole room on screen (never zooming in past 100%) and centers it. */
    private centerCamera() {
        const bounds = this.world.getLocalBounds();
        const { width, height } = this.app.screen;
        // Leave room for the overlays at the top and bottom of the canvas.
        const scale = Math.max(0.35, Math.min(1, (width - 40) / bounds.width, (height - 150) / bounds.height));
        this.world.scale.set(scale);
        this.world.position.set(
            Math.round(width / 2 - (bounds.x + bounds.width / 2) * scale),
            Math.round(height / 2 - (bounds.y + bounds.height / 2) * scale),
        );
    }

    zoom(factor: number) {
        const next = Math.min(2, Math.max(0.35, this.world.scale.x * factor));
        const { width, height } = this.app.screen;
        const cx = (width / 2 - this.world.x) / this.world.scale.x;
        const cy = (height / 2 - this.world.y) / this.world.scale.y;
        this.world.scale.set(next);
        this.world.position.set(width / 2 - cx * next, height / 2 - cy * next);
    }

    // ---- input ----

    private setupInput() {
        const stage = this.app.stage;
        stage.eventMode = 'static';
        stage.hitArea = this.app.screen;

        stage.on('pointerdown', (e: FederatedPointerEvent) => {
            this.dragStart = { x: e.global.x, y: e.global.y, worldX: this.world.x, worldY: this.world.y };
            this.dragged = false;
        });
        stage.on('pointermove', (e: FederatedPointerEvent) => {
            if (this.dragStart && (e.buttons & 1) === 1) {
                const dx = e.global.x - this.dragStart.x;
                const dy = e.global.y - this.dragStart.y;
                if (this.dragged || Math.abs(dx) + Math.abs(dy) > 6) {
                    this.dragged = true;
                    this.world.position.set(this.dragStart.worldX + dx, this.dragStart.worldY + dy);
                }
            }
            this.updateHover(e);
        });
        const end = (e: FederatedPointerEvent) => {
            if (this.dragStart && !this.dragged) {
                const avatar = this.avatarAt(e);
                if (avatar) {
                    this.events.onAvatarClick(avatar);
                } else {
                    const local = this.world.toLocal(e.global);
                    const tile = screenToTile(local.x, local.y);
                    if (this.isFloor(tile.x, tile.y)) {
                        this.events.onTileClick(tile.x, tile.y);
                    }
                }
            }
            this.dragStart = null;
        };
        stage.on('pointerup', end);
        stage.on('pointerupoutside', () => {
            this.dragStart = null;
        });
    }

    private avatarAt(e: FederatedPointerEvent): string | null {
        let best: Walker | null = null;
        for (const walker of this.walkers.values()) {
            const bounds = walker.sprite.getBounds();
            if (bounds.contains(e.global.x, e.global.y) && (!best || walker.sprite.zIndex > best.sprite.zIndex)) {
                best = walker;
            }
        }
        return best ? best.sprite.id : null;
    }

    private updateHover(e: FederatedPointerEvent) {
        const local = this.world.toLocal(e.global);
        const tile = screenToTile(local.x, local.y);
        this.hover.clear();
        if (this.isFloor(tile.x, tile.y)) {
            this.hover.lineStyle(2, 0xffffff, 0.8);
            const pts = [project(tile.x, tile.y), project(tile.x + 1, tile.y), project(tile.x + 1, tile.y + 1), project(tile.x, tile.y + 1)];
            this.hover.drawPolygon(pts.flatMap((p) => [p.x, p.y]));
        }
    }

    // ---- avatars ----

    addOccupant(occupant: Occupant) {
        this.removeOccupant(occupant.id);
        const sprite = new AvatarSprite(occupant, occupant.id === this.room.youId);
        const walker: Walker = {
            sprite,
            x: occupant.x,
            y: occupant.y,
            queue: [],
            from: [occupant.x, occupant.y],
            to: null,
            progress: 0,
            dir: 'se',
        };
        this.walkers.set(occupant.id, walker);
        this.entities.addChild(sprite);
        this.placeWalker(walker);
    }

    removeOccupant(id: string) {
        const walker = this.walkers.get(id);
        if (walker) {
            walker.sprite.destroy({ children: true });
            this.walkers.delete(id);
        }
    }

    updateOccupant(occupant: Occupant) {
        this.walkers.get(occupant.id)?.sprite.update(occupant);
    }

    /** Server path: first entry is where the walk starts, the rest are the steps. */
    moveOccupant(id: string, path: number[][]) {
        const walker = this.walkers.get(id);
        if (!walker || path.length < 2) {
            return;
        }
        const steps = path.slice(1).map(([x, y]) => [x, y] as [number, number]);
        if (walker.to) {
            // Finish the current step, then continue from wherever the server says we start.
            const [sx, sy] = path[0];
            walker.queue = walker.to[0] === sx && walker.to[1] === sy ? steps : [[sx, sy], ...steps];
        } else {
            const [sx, sy] = path[0];
            if (Math.abs(walker.x - sx) + Math.abs(walker.y - sy) > 0.01) {
                walker.x = sx;
                walker.y = sy;
            }
            walker.from = [sx, sy];
            walker.queue = steps;
            this.nextStep(walker);
        }
    }

    private nextStep(walker: Walker) {
        const next = walker.queue.shift();
        if (!next) {
            walker.to = null;
            return;
        }
        walker.from = [Math.round(walker.x), Math.round(walker.y)];
        walker.to = next;
        walker.progress = 0;
        walker.dir = dirFromStep(next[0] - walker.from[0], next[1] - walker.from[1]);
    }

    private placeWalker(walker: Walker) {
        const pos = tileCenter(walker.x, walker.y);
        const tileX = Math.round(walker.x);
        const tileY = Math.round(walker.y);
        const seat = walker.to ? undefined : this.seats.get(`${tileX},${tileY}`);
        const lift = seat ? (seat.type === 'stool' ? 4 : 2) : 0;
        walker.sprite.position.set(pos.x, pos.y - lift);
        walker.sprite.zIndex = depthOf(walker.x, walker.y, 50);
        walker.sprite.setPose(seat ? seat.dir : walker.dir, walker.to !== null, Boolean(seat));
    }

    private tick = () => {
        const delta = this.app.ticker.deltaMS / 1000;
        for (const walker of this.walkers.values()) {
            if (walker.to) {
                walker.progress += delta / STEP_SECONDS;
                while (walker.to && walker.progress >= 1) {
                    walker.x = walker.to[0];
                    walker.y = walker.to[1];
                    const carry = walker.progress - 1;
                    this.nextStep(walker);
                    walker.progress = walker.to ? carry : 0;
                }
                if (walker.to) {
                    walker.x = walker.from[0] + (walker.to[0] - walker.from[0]) * walker.progress;
                    walker.y = walker.from[1] + (walker.to[1] - walker.from[1]) * walker.progress;
                }
                this.placeWalker(walker);
            }
            walker.sprite.tick(delta);
        }
        this.tickBubbles();
    };

    // ---- chat bubbles ----

    showChat(message: ChatMessage) {
        const walker = this.walkers.get(message.fromId);
        const view = new Container();
        const name = new Text(`${message.name}: `, { fontFamily: 'Verdana, sans-serif', fontSize: 11, fontWeight: 'bold', fill: 0x000000 });
        const text = new Text(message.text, {
            fontFamily: 'Verdana, sans-serif',
            fontSize: 11,
            fill: 0x000000,
            wordWrap: true,
            wordWrapWidth: 220 - name.width,
            breakWords: true,
        });
        text.x = name.width;
        const width = name.width + text.width + 16;
        const height = Math.max(name.height, text.height) + 8;
        const bg = new Graphics();
        bg.beginFill(0xffffff, 0.96);
        bg.lineStyle(1, 0x000000, 0.6);
        bg.drawRoundedRect(0, 0, width, height, 6);
        bg.endFill();
        name.position.set(8, 4);
        text.position.set(8 + name.width, 4);
        view.addChild(bg, name, text);

        const anchor = walker ? walker.sprite.position : tileCenter(this.room.doorX, this.room.doorY);
        view.position.set(Math.round(anchor.x - width / 2), Math.round(anchor.y - 100 - height));

        // Older bubbles float up to make room, like Habbo.
        for (const bubble of this.bubbleList) {
            bubble.view.y -= height + 4;
        }
        this.bubbles.addChild(view);
        this.bubbleList.push({ view, born: performance.now(), height });
    }

    private tickBubbles() {
        const now = performance.now();
        this.bubbleList = this.bubbleList.filter((bubble) => {
            const age = now - bubble.born;
            if (age > BUBBLE_LIFETIME) {
                bubble.view.destroy({ children: true });
                return false;
            }
            bubble.view.alpha = age > BUBBLE_LIFETIME - 1000 ? (BUBBLE_LIFETIME - age) / 1000 : 1;
            return true;
        });
    }

    setWhiteboard(text: string) {
        this.setWhiteboardText?.(text);
    }
}
