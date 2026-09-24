import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { hexToNumber, shade } from './iso';
import { AvatarLook, Dir, Occupant } from './types';

/** Everything that changes how an avatar is posed on a given frame. */
export interface Pose {
    dir: Dir;
    walking: boolean;
    walkPhase: number;
    /** 'chair' when sitting on a seat, 'floor' when sitting on the floor. */
    sitting: 'chair' | 'floor' | null;
    dance: number;
    danceTime: number;
    waving: boolean;
    waveTime: number;
    blinking: boolean;
    handRaised: boolean;
}

export const idlePose = (dir: Dir = 'se'): Pose => ({
    dir,
    walking: false,
    walkPhase: 0,
    sitting: null,
    dance: 0,
    danceTime: 0,
    waving: false,
    waveTime: 0,
    blinking: false,
    handRaised: false,
});

const SHOULDER_Y = -35;
const ARM_LENGTH = 14;
const HEAD_TOP = -60;

/**
 * Draws an arm from the shoulder. raise = 0 hangs straight down, 0.5 points at the viewer,
 * 1 points straight up. The part near the shoulder uses the sleeve color, the rest is skin.
 */
const arm = (g: Graphics, baseX: number, top: number, raise: number, sleeve: number, skin: number, sleeveShare: number) => {
    // Raised arms swing out to the side so the big head doesn't hide them.
    const x = baseX + Math.sign(baseX) * 6 * Math.max(0, raise - 0.3);
    const shoulder = top + SHOULDER_Y;
    const handY = shoulder + ARM_LENGTH * (1 - 2 * raise);
    const length = Math.max(3, Math.abs(handY - shoulder));
    const down = handY >= shoulder;
    const sleeveLength = length * sleeveShare;
    g.beginFill(skin);
    g.drawRoundedRect(x, down ? shoulder : handY, 5, length, 2);
    g.endFill();
    g.beginFill(sleeve);
    g.drawRoundedRect(x, down ? shoulder : shoulder - sleeveLength, 5, sleeveLength, 2);
    g.endFill();
    g.beginFill(skin);
    g.drawCircle(x + 2.5, handY, 2.8);
    g.endFill();
};

/**
 * Draws a chunky, cute Habbo-like avatar facing right (the caller mirrors it for left).
 * Origin is at the feet.
 */
export const drawAvatar = (g: Graphics, look: AvatarLook, pose: Pose) => {
    const skin = hexToNumber(look.skin);
    const hair = hexToNumber(look.hair);
    const shirt = hexToNumber(look.shirt);
    const pants = hexToNumber(look.pants);
    const shoes = hexToNumber(look.shoes);
    const hatColor = hexToNumber(look.hatColor);
    const front = pose.dir === 'se' || pose.dir === 'sw';
    const swing = pose.walking ? Math.sin(pose.walkPhase) * 4 : 0;

    // Dance moves: body offsets and how high each arm is raised.
    let bodyX = 0;
    let bodyY = 0;
    let frontRaise = 0;
    let backRaise = 0;
    const t = pose.danceTime;
    switch (pose.sitting ? 0 : pose.dance) {
        case 1: // hab dance: bob and alternate arms
            bodyY = -Math.abs(Math.sin(t * 6)) * 3;
            frontRaise = Math.sin(t * 6) > 0 ? 0.9 : 0.1;
            backRaise = Math.sin(t * 6) > 0 ? 0.1 : 0.9;
            break;
        case 2: // pogo: jump with arms up
            bodyY = -Math.abs(Math.sin(t * 7)) * 8;
            frontRaise = 1;
            backRaise = 1;
            break;
        case 3: // duck funk: sway side to side
            bodyX = Math.sin(t * 5) * 3;
            bodyY = -Math.abs(Math.cos(t * 5)) * 2;
            frontRaise = 0.5 + Math.sin(t * 5) * 0.4;
            backRaise = 0.5 - Math.sin(t * 5) * 0.4;
            break;
        case 4: // rollie: arms rolling
            bodyY = -Math.abs(Math.sin(t * 8)) * 2;
            frontRaise = 0.45 + Math.sin(t * 10) * 0.2;
            backRaise = 0.45 + Math.cos(t * 10) * 0.2;
            break;
        default:
            break;
    }
    if (pose.handRaised || pose.waving) {
        frontRaise = 1;
    }
    const waveX = pose.waving ? Math.sin(pose.waveTime * 18) * 2 : 0;

    const sitDrop = pose.sitting === 'floor' ? 12 : pose.sitting === 'chair' ? 6 : 0;
    const top = bodyY + sitDrop;
    const sleeveShare = look.top === 'tshirt' || look.top === 'jersey' || look.top === 'uniform' || look.top === 'dress' ? 0.4 : 1;

    g.clear();
    g.position.x = bodyX;

    // shadow
    g.beginFill(0x000000, 0.22);
    g.drawEllipse(-bodyX, 0, 13 - Math.min(4, -bodyY / 2), 6);
    g.endFill();

    // hair that hangs behind the body
    drawHairBack(g, look.hairStyle, hair, front, top);
    if (look.top === 'hoodie' && front) {
        g.beginFill(shade(shirt, -25));
        g.drawRoundedRect(-11, top - 42, 20, 10, 5);
        g.endFill();
    }

    // back arm
    arm(g, -12, top, backRaise, shade(shirt, -30), shade(skin, -15), sleeveShare);

    // legs
    const legColor = look.bottom === 'pants' ? pants : skin;
    if (pose.sitting === 'floor') {
        g.beginFill(legColor);
        g.drawRoundedRect(-4, top - 17, 16, 6, 2);
        g.drawRoundedRect(-2, top - 13, 16, 6, 2);
        g.endFill();
        g.beginFill(shoes);
        g.drawRoundedRect(12, top - 17, 4, 6, 1);
        g.drawRoundedRect(14, top - 13, 4, 6, 1);
        g.endFill();
    } else if (pose.sitting === 'chair') {
        g.beginFill(legColor);
        g.drawRoundedRect(-6, top - 17, 14, 6, 2);
        g.drawRect(front ? 3 : -6, top - 13, 5, 11);
        g.endFill();
        g.beginFill(shoes);
        g.drawRoundedRect(front ? 2 : -7, top - 3, 7, 3, 1);
        g.endFill();
    } else {
        const backLeg = Math.max(0, -swing) / 2;
        const frontLeg = Math.max(0, swing) / 2;
        g.beginFill(shade(legColor, -18));
        g.drawRoundedRect(-6, top - 17 + backLeg, 6, 16 - backLeg, 2);
        g.endFill();
        g.beginFill(legColor);
        g.drawRoundedRect(1, top - 17 + frontLeg, 6, 16 - frontLeg, 2);
        g.endFill();
        g.beginFill(shoes);
        g.drawRoundedRect(-7, top - 3, 8, 4, 2);
        g.drawRoundedRect(0, top - 3, 8, 4, 2);
        g.endFill();
    }
    if (look.bottom === 'shorts') {
        g.beginFill(pants);
        g.drawRoundedRect(-7, top - 19, 15, 8, 2);
        g.endFill();
    }
    if (look.bottom === 'skirt' || look.top === 'dress') {
        g.beginFill(look.top === 'dress' ? shirt : pants);
        g.drawPolygon([-8, top - 20, 9, top - 20, 12, top - 8, -11, top - 8]);
        g.endFill();
    }

    // torso
    g.beginFill(shirt);
    g.drawRoundedRect(-9, top - 37, 18, 20, 5);
    g.endFill();
    if (look.top === 'uniform' && front) {
        g.beginFill(0xffffff);
        g.drawPolygon([-3, top - 37, 3, top - 37, 0, top - 33]);
        g.endFill();
        g.beginFill(0x1d3557);
        g.drawPolygon([-1, top - 34, 1.5, top - 34, 2, top - 24, 0, top - 22, -1.5, top - 24]);
        g.endFill();
    }
    if (look.top === 'jersey') {
        g.beginFill(0xffffff, 0.9);
        g.drawRect(-9, top - 30, 18, 2.5);
        g.endFill();
        if (front) {
            // a "7" on the chest
            g.beginFill(0xffffff);
            g.drawRect(1, top - 27, 5, 1.5);
            g.drawRect(4.5, top - 27, 1.5, 7);
            g.endFill();
        }
    }
    if (look.top === 'hoodie' && front) {
        g.beginFill(shade(shirt, -20));
        g.drawRoundedRect(-5, top - 25, 11, 5, 2);
        g.endFill();
        g.lineStyle(1, 0xffffff, 0.8);
        g.moveTo(-2, top - 36).lineTo(-2, top - 30);
        g.moveTo(3, top - 36).lineTo(3, top - 30);
        g.lineStyle(0);
    }
    if (look.bottom === 'pants' || look.bottom === 'shorts') {
        g.beginFill(shade(pants, -10));
        g.drawRect(-9, top - 20, 18, 3);
        g.endFill();
    }

    // front arm
    arm(g, 8 + waveX, top, frontRaise, shirt, skin, sleeveShare);

    // head: big and round, Habbo style
    g.beginFill(skin);
    g.drawRoundedRect(-10, top + HEAD_TOP + 2, 21, 22, 9);
    g.endFill();
    if (front) {
        // ear
        g.beginFill(shade(skin, -12));
        g.drawEllipse(-8, top - 46, 2.5, 3.5);
        g.endFill();
        // eyes
        g.beginFill(0x1b1b1b);
        if (pose.blinking) {
            g.drawRect(2, top - 47, 3, 1);
            g.drawRect(7.5, top - 47, 3, 1);
        } else {
            g.drawEllipse(3.5, top - 47, 1.6, 2.2);
            g.drawEllipse(9, top - 47, 1.6, 2.2);
            g.endFill();
            g.beginFill(0xffffff);
            g.drawCircle(4, top - 48, 0.6);
            g.drawCircle(9.5, top - 48, 0.6);
        }
        g.endFill();
        // blush and smile
        g.beginFill(0xff6b8b, 0.35);
        g.drawEllipse(1, top - 43, 2.2, 1.4);
        g.drawEllipse(10.5, top - 43, 1.8, 1.4);
        g.endFill();
        g.lineStyle(1.2, shade(skin, -90), 1);
        g.arc(6.5, top - 44, 2.2, 0.3, Math.PI - 0.3);
        g.lineStyle(0);
    }

    drawHairFront(g, look.hairStyle, hair, front, top);
    drawHat(g, look.hat, hatColor, front, top);
};

const drawHairBack = (g: Graphics, style: string, color: number, front: boolean, top: number) => {
    g.beginFill(shade(color, -15));
    if (style === 'long') {
        g.drawRoundedRect(-12, top - 58, front ? 10 : 24, 28, 5);
    } else if (style === 'pigtails' && front) {
        g.drawCircle(-12, top - 42, 4.5);
    }
    g.endFill();
};

const drawHairFront = (g: Graphics, style: string, color: number, front: boolean, top: number) => {
    if (style === 'bald') {
        return;
    }
    g.beginFill(color);
    if (!front) {
        // From behind, hair covers the whole head.
        g.drawRoundedRect(-11, top - 61, 23, style === 'long' ? 30 : 22, 9);
        if (style === 'bun') g.drawCircle(0, top - 61, 5.5);
        if (style === 'pigtails') {
            g.drawCircle(-13, top - 44, 4.5);
            g.drawCircle(13, top - 44, 4.5);
        }
        if (style === 'spiky') {
            for (let i = 0; i < 4; i++) g.drawPolygon([-9 + i * 5, top - 58, -6 + i * 5, top - 66, -3 + i * 5, top - 58]);
        }
        g.endFill();
        return;
    }
    switch (style) {
        case 'spiky':
            g.drawRoundedRect(-11, top - 60, 23, 8, 3);
            for (let i = 0; i < 5; i++) {
                g.drawPolygon([-11 + i * 5, top - 58, -8 + i * 5, top - 67 + (i % 2) * 2, -5 + i * 5, top - 58]);
            }
            g.drawRect(-11, top - 56, 5, 8);
            break;
        case 'curly':
            for (let i = 0; i < 5; i++) g.drawCircle(-8 + i * 4.5, top - 59 + (i % 2), 4.5);
            g.drawCircle(-10, top - 53, 4);
            g.drawCircle(-10, top - 48, 3.5);
            break;
        case 'long':
            g.drawRoundedRect(-11, top - 62, 24, 10, 5);
            g.drawRoundedRect(-12, top - 58, 7, 24, 3);
            g.drawPolygon([2, top - 55, 12, top - 55, 12, top - 50]);
            break;
        case 'bun':
            g.drawCircle(-4, top - 64, 5.5);
            g.drawRoundedRect(-11, top - 62, 24, 9, 5);
            g.drawRect(-11, top - 56, 5, 8);
            break;
        case 'pigtails':
            g.drawRoundedRect(-11, top - 62, 24, 9, 5);
            g.drawRect(-11, top - 56, 5, 7);
            g.drawCircle(13, top - 44, 4.5);
            break;
        default: // short
            g.drawRoundedRect(-11, top - 62, 24, 9, 5);
            g.drawRect(-11, top - 56, 5, 9);
            g.drawPolygon([4, top - 56, 12, top - 56, 12, top - 52]);
            break;
    }
    g.endFill();
};

const drawHat = (g: Graphics, hat: string, color: number, front: boolean, top: number) => {
    switch (hat) {
        case 'cap':
            g.beginFill(color);
            g.drawRoundedRect(-11, top - 66, 23, 10, 6);
            g.endFill();
            g.beginFill(shade(color, -30));
            g.drawRoundedRect(front ? 6 : -4, top - 58, 12, 3, 1.5);
            g.endFill();
            break;
        case 'beanie':
            g.beginFill(color);
            g.drawRoundedRect(-11, top - 67, 23, 12, 7);
            g.endFill();
            g.beginFill(shade(color, -25));
            g.drawRect(-11, top - 58, 23, 4);
            g.endFill();
            g.beginFill(0xffffff);
            g.drawCircle(0.5, top - 68, 3);
            g.endFill();
            break;
        case 'bow':
            g.beginFill(color);
            g.drawPolygon([-4, top - 64, -10, top - 68, -10, top - 60]);
            g.drawPolygon([-4, top - 64, 2, top - 68, 2, top - 60]);
            g.endFill();
            g.beginFill(shade(color, -30));
            g.drawCircle(-4, top - 64, 2);
            g.endFill();
            break;
        case 'party':
            g.beginFill(color);
            g.drawPolygon([-8, top - 60, 8, top - 60, 0, top - 78]);
            g.endFill();
            g.beginFill(0xffd166);
            g.drawPolygon([-5, top - 66, 5, top - 66, 3.5, top - 70, -3.5, top - 70]);
            g.drawCircle(0, top - 78, 2.5);
            g.endFill();
            break;
        case 'headphones':
            g.lineStyle(2.5, 0x2b2d42);
            g.arc(0.5, top - 52, 12.5, Math.PI, 0);
            g.lineStyle(0);
            g.beginFill(color);
            g.drawRoundedRect(front ? -13 : 9, top - 54, 6, 9, 2);
            g.endFill();
            break;
        case 'gradcap':
            g.beginFill(0x1b1b1b);
            g.drawRect(-8, top - 64, 17, 5);
            g.drawPolygon([-15, top - 65, 0, top - 70, 16, top - 65, 0, top - 61]);
            g.endFill();
            g.lineStyle(1, color);
            g.moveTo(0, top - 66).lineTo(12, top - 64).lineTo(12, top - 56);
            g.lineStyle(0);
            g.beginFill(color);
            g.drawCircle(12, top - 56, 1.5);
            g.endFill();
            break;
        case 'crown':
            g.beginFill(0xffc300);
            g.drawPolygon([-9, top - 58, 10, top - 58, 11, top - 70, 5, top - 64, 0.5, top - 72, -4, top - 64, -10, top - 70]);
            g.endFill();
            g.beginFill(0xe63946);
            g.drawCircle(0.5, top - 62, 1.8);
            g.endFill();
            g.beginFill(0x4cc9f0);
            g.drawCircle(-5, top - 61, 1.3);
            g.drawCircle(6, top - 61, 1.3);
            g.endFill();
            break;
        default:
            break;
    }
};

/**
 * A room avatar: body, name tag, raised-hand badge. The origin is at the feet,
 * so it can be placed on a tile center.
 */
export class AvatarSprite extends Container {
    private body = new Graphics();
    private label: Text;
    private hand = new Text('✋', { fontSize: 15 });
    private occupant: Occupant;
    private pose: Pose = idlePose();
    private nextBlink = 2 + Math.random() * 3;
    private blinkLeft = 0;
    private dirty = true;

    constructor(occupant: Occupant, isYou: boolean) {
        super();
        this.occupant = occupant;
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
        this.hitArea = new Rectangle(-14, -66, 28, 70);
        this.applyOccupant();
    }

    get id() {
        return this.occupant.id;
    }

    get headTop() {
        return this.label.y;
    }

    update(occupant: Occupant) {
        this.occupant = occupant;
        this.applyOccupant();
    }

    private applyOccupant() {
        this.label.text = this.occupant.name + (this.occupant.muted ? ' 🔇' : '');
        this.pose.handRaised = this.occupant.handRaised;
        this.pose.dance = this.occupant.dance;
        this.dirty = true;
    }

    /** Sets direction, walking and sitting; floor sitting comes from the occupant state. */
    setPose(dir: Dir, walking: boolean, onSeat: boolean) {
        const sitting = onSeat ? 'chair' : this.occupant.sittingOnFloor && !walking ? 'floor' : null;
        if (dir !== this.pose.dir || walking !== this.pose.walking || sitting !== this.pose.sitting) {
            this.pose.dir = dir;
            this.pose.walking = walking;
            this.pose.sitting = sitting;
            this.dirty = true;
        }
    }

    wave() {
        this.pose.waving = true;
        this.pose.waveTime = 0;
        this.dirty = true;
    }

    /** Advances animations (walk, dance, wave, blink). */
    tick(deltaSeconds: number) {
        if (this.pose.walking) {
            this.pose.walkPhase += deltaSeconds * 9;
            this.dirty = true;
        }
        if (this.pose.dance && !this.pose.sitting) {
            this.pose.danceTime += deltaSeconds;
            this.dirty = true;
        }
        if (this.pose.waving) {
            this.pose.waveTime += deltaSeconds;
            if (this.pose.waveTime > 2) this.pose.waving = false;
            this.dirty = true;
        }
        this.nextBlink -= deltaSeconds;
        if (this.nextBlink <= 0) {
            this.pose.blinking = true;
            this.blinkLeft = 0.14;
            this.nextBlink = 2.5 + Math.random() * 3.5;
            this.dirty = true;
        }
        if (this.pose.blinking) {
            this.blinkLeft -= deltaSeconds;
            if (this.blinkLeft <= 0) {
                this.pose.blinking = false;
                this.dirty = true;
            }
        }
        if (this.dirty) this.redraw();
    }

    private redraw() {
        this.dirty = false;
        const facingRight = this.pose.dir === 'se' || this.pose.dir === 'ne';
        drawAvatar(this.body, this.occupant.look, this.pose);
        this.body.scale.x = facingRight ? 1 : -1;
        if (!facingRight) this.body.position.x = -this.body.position.x;
        const drop = this.pose.sitting === 'floor' ? 12 : this.pose.sitting === 'chair' ? 6 : 0;
        const hatExtra = this.occupant.look.hat === 'party' ? 12 : this.occupant.look.hat === 'none' ? 0 : 6;
        this.label.position.set(0, drop - 66 - hatExtra);
        this.hand.visible = this.occupant.handRaised;
        this.hand.position.set(this.label.width / 2 + 9, this.label.y + 2);
    }
}
