import { Container, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import { Dir8, ROW_FOR_DIR } from './directions';
import { Anim, FrameSet, loadFrames } from './lpcAvatar';
import { Occupant } from './types';

/** Sprites are 64px frames; this makes the character about one tile tall like Habbo. */
const SCALE = 1.2;
/** The feet sit a couple of pixels above the bottom of each frame. */
const FEET_Y = 62;
const WALK_FPS = 11;
const IDLE_FPS = 1.6;

/**
 * A pixel-art avatar built from LPC sprites (see lpcAvatar.ts). The origin is at the feet,
 * so it can be placed on a tile center.
 */
export class AvatarSprite extends Container {
    private body = new Sprite(Texture.EMPTY);
    private label: Text;
    private hand = new Text('✋', { fontSize: 15 });
    private waveIcon = new Text('👋', { fontSize: 16 });
    private occupant: Occupant;
    private frames: FrameSet | null = null;
    private lookKey = '';
    private dir: Dir8 = 's';
    private walking = false;
    private seat: 'chair' | 'floor' | null = null;
    private time = 0;
    private waveLeft = 0;

    constructor(occupant: Occupant, isYou: boolean) {
        super();
        this.occupant = occupant;
        this.body.anchor.set(0.5, FEET_Y / 64);
        this.body.scale.set(SCALE);
        this.label = new Text(occupant.name, {
            fontFamily: 'Verdana, sans-serif',
            fontSize: 10,
            fontWeight: 'bold',
            fill: occupant.isTeacher ? 0xffd166 : isYou ? 0x9bf6ff : 0xffffff,
            stroke: 0x000000,
            strokeThickness: 3,
        });
        this.label.anchor.set(0.5, 1);
        this.hand.anchor.set(0.5, 1);
        this.waveIcon.anchor.set(0.5, 1);
        this.waveIcon.visible = false;
        this.addChild(this.body, this.label, this.hand, this.waveIcon);

        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.hitArea = new Rectangle(-16, -64, 32, 68);
        this.applyOccupant();
    }

    get id() {
        return this.occupant.id;
    }

    update(occupant: Occupant) {
        this.occupant = occupant;
        this.applyOccupant();
    }

    private applyOccupant() {
        this.label.text = this.occupant.name + (this.occupant.muted ? ' 🔇' : '');
        const key = JSON.stringify(this.occupant.look);
        if (key !== this.lookKey) {
            this.lookKey = key;
            loadFrames(this.occupant.look)
                .then((frames) => {
                    if (this.destroyed || key !== this.lookKey) return;
                    this.frames = frames;
                    this.applyPose();
                })
                .catch(() => undefined);
        }
        this.applyPose();
    }

    /** Sets direction, walking and sitting; floor sitting comes from the occupant state. */
    setPose(dir: Dir8, walking: boolean, onSeat: boolean) {
        const seat = onSeat ? 'chair' : this.occupant.sittingOnFloor && !walking ? 'floor' : null;
        if (dir !== this.dir || walking !== this.walking || seat !== this.seat) {
            this.dir = dir;
            this.walking = walking;
            this.seat = seat;
            this.applyPose();
        }
    }

    wave() {
        this.waveLeft = 2;
    }

    /** Advances the animations. */
    tick(deltaSeconds: number) {
        this.time += deltaSeconds;
        if (this.waveLeft > 0) this.waveLeft = Math.max(0, this.waveLeft - deltaSeconds);
        this.applyPose();
    }

    private applyPose() {
        const dance = this.seat ? 0 : this.occupant.dance;
        let dir = this.dir;
        let anim: Anim = 'idle';
        let frame = Math.floor(this.time * IDLE_FPS) % 2;
        let bob = 0;
        let sway = 0;

        if (this.seat) {
            anim = 'sit';
            // Column 2 is sitting on a chair, column 0 sitting on the floor.
            frame = this.seat === 'chair' ? 2 : 0;
        } else if (this.walking) {
            anim = 'walk';
            frame = 1 + (Math.floor(this.time * WALK_FPS) % 8);
        } else if (dance) {
            const t = this.time;
            switch (dance) {
                case 1: // hab dance: step in place and bob
                    anim = 'walk';
                    frame = 1 + (Math.floor(t * 8) % 8);
                    bob = Math.abs(Math.sin(t * 8)) * 3;
                    break;
                case 2: // pogo: jump up and down
                    bob = Math.abs(Math.sin(t * 7)) * 9;
                    break;
                case 3: // duck funk: turn from side to side
                    dir = Math.floor(t * 3) % 2 === 0 ? 'w' : 'e';
                    anim = 'walk';
                    frame = 1 + (Math.floor(t * 10) % 8);
                    sway = Math.sin(t * 6) * 3;
                    break;
                default: // rollie: spin through all four directions
                    dir = (['s', 'w', 'n', 'e'] as Dir8[])[Math.floor(t * 4) % 4];
                    bob = Math.abs(Math.sin(t * 8)) * 2;
                    break;
            }
        }

        if (this.frames) {
            this.body.texture = this.frames[anim][ROW_FOR_DIR[dir]][frame];
        }
        this.body.position.set(sway, -bob);

        const seated = this.seat !== null;
        const headTop = (seated ? -44 : -58) - bob;
        this.label.position.set(0, headTop - 4);
        this.hand.visible = this.occupant.handRaised;
        this.hand.position.set(this.label.width / 2 + 9, this.label.y + 2);
        this.waveIcon.visible = this.waveLeft > 0;
        this.waveIcon.position.set(14, headTop + 14);
        this.waveIcon.rotation = Math.sin(this.time * 14) * 0.4;
    }
}
