import { Container, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import { avatarFrame, Dir8, FEET_Y, FLOOR_DROP, FRAME_H, HEAD_TOP, Pose, PoseKind, SIT_DROP } from './pixelAvatar';
import { Occupant } from './types';

const WALK_FPS = 9;

/**
 * A pixel-art avatar (see avatarArt.ts) in 8 directions. The origin is at the feet,
 * so it can be placed on a tile center.
 */
export class AvatarSprite extends Container {
    private body = new Sprite(Texture.EMPTY);
    private label: Text;
    private hand = new Text('✋', { fontSize: 15 });
    private occupant: Occupant;
    private dir: Dir8 = 'se';
    private walking = false;
    private seat: 'chair' | 'floor' | null = null;
    private time = 0;
    private waveLeft = 0;
    private nextBlink = 2 + Math.random() * 3;
    private blinkLeft = 0;

    constructor(occupant: Occupant, isYou: boolean) {
        super();
        this.occupant = occupant;
        this.body.anchor.set(0.5, FEET_Y / FRAME_H);
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
        this.addChild(this.body, this.label, this.hand);

        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.hitArea = new Rectangle(-14, -HEAD_TOP - 2, 28, HEAD_TOP + 4);
        this.applyPose();
    }

    get id() {
        return this.occupant.id;
    }

    update(occupant: Occupant) {
        this.occupant = occupant;
        this.applyPose();
    }

    /** Sets the facing, walking and sitting; floor sitting comes from the occupant state. */
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
        this.nextBlink -= deltaSeconds;
        if (this.nextBlink <= 0) {
            this.blinkLeft = 0.15;
            this.nextBlink = 2.5 + Math.random() * 3.5;
        }
        if (this.blinkLeft > 0) this.blinkLeft -= deltaSeconds;
        this.applyPose();
    }

    private applyPose() {
        const dance = this.seat ? 0 : this.occupant.dance;
        const t = this.time;
        let dir = this.dir;
        let kind: PoseKind = this.seat === 'chair' ? 'sit' : this.seat === 'floor' ? 'floor' : this.walking ? 'walk' : 'stand';
        let frame = Math.floor(t * WALK_FPS) % 4;
        let nearArmUp = this.occupant.handRaised || this.waveLeft > 0;
        let bothArmsUp = false;
        let bob = 0;

        if (dance && !this.walking) {
            switch (dance) {
                case 1: // hab dance: step in place, arms taking turns
                    kind = 'walk';
                    frame = Math.floor(t * 7) % 4;
                    nearArmUp = frame < 2;
                    bob = frame % 2;
                    break;
                case 2: // pogo: jump with both arms up
                    bothArmsUp = true;
                    bob = Math.round(Math.abs(Math.sin(t * 7)) * 8);
                    break;
                case 3: // duck funk: turn from side to side
                    dir = Math.floor(t * 3) % 2 === 0 ? 'sw' : 'se';
                    kind = 'walk';
                    frame = Math.floor(t * 9) % 4;
                    break;
                default: // rollie: spin through all eight directions
                    dir = (['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'] as Dir8[])[Math.floor(t * 8) % 8];
                    bob = Math.round(Math.abs(Math.sin(t * 8)) * 2);
                    break;
            }
        }

        const pose: Pose = { kind, frame, nearArmUp, bothArmsUp, blink: this.blinkLeft > 0 };
        const { texture, mirror } = avatarFrame(this.occupant.look, dir, pose);
        this.body.texture = texture;
        this.body.scale.x = mirror ? -1 : 1;
        // Waving flaps the raised hand side to side.
        const flap = this.waveLeft > 0 && !this.occupant.handRaised ? Math.round(Math.sin(t * 16)) : 0;
        this.body.position.set(flap, -bob);

        const drop = kind === 'sit' ? SIT_DROP : kind === 'floor' ? FLOOR_DROP : 0;
        const headTop = -HEAD_TOP + drop - bob;
        this.label.text = this.occupant.name + (this.occupant.muted ? ' 🔇' : '');
        this.label.position.set(0, headTop - 6);
        this.hand.visible = this.occupant.handRaised;
        this.hand.position.set(this.label.width / 2 + 9, this.label.y + 2);
    }
}
