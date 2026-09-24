import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { hexToNumber, shade } from './iso';
import { AvatarLook, Dir, Occupant } from './types';

/**
 * A simple Habbo-style avatar drawn with shapes. Its origin is at the feet,
 * so it can be placed on a tile center.
 */
export class AvatarSprite extends Container {
    private body = new Graphics();
    private label: Text;
    private hand = new Text('✋', { fontSize: 16 });
    private occupant: Occupant;
    private dir: Dir = 'se';
    private sitting = false;
    private walkPhase = 0;
    private walking = false;

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
        this.label.position.set(0, -68);
        this.hand.anchor.set(0.5, 1);
        this.hand.position.set(14, -60);
        this.addChild(this.body, this.label, this.hand);

        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.hitArea = new Rectangle(-14, -66, 28, 70);
        this.redraw();
    }

    get id() {
        return this.occupant.id;
    }

    update(occupant: Occupant) {
        this.occupant = occupant;
        this.label.text = occupant.name + (occupant.muted ? ' 🔇' : '');
        this.redraw();
    }

    setPose(dir: Dir, walking: boolean, sitting: boolean) {
        if (dir === this.dir && walking === this.walking && sitting === this.sitting) {
            return;
        }
        this.dir = dir;
        this.walking = walking;
        this.sitting = sitting;
        this.redraw();
    }

    /** Advances the walk animation. */
    tick(deltaSeconds: number) {
        if (!this.walking) {
            return;
        }
        this.walkPhase += deltaSeconds * 9;
        this.redraw();
    }

    private redraw() {
        const g = this.body;
        const look: AvatarLook = this.occupant.look;
        const skin = hexToNumber(look.skin);
        const hair = hexToNumber(look.hair);
        const shirt = hexToNumber(look.shirt);
        const pants = hexToNumber(look.pants);
        const facingViewer = this.dir === 'se' || this.dir === 'sw';
        const facingRight = this.dir === 'se' || this.dir === 'ne';
        const swing = this.walking ? Math.sin(this.walkPhase) * 4 : 0;
        const lift = this.sitting ? 12 : 0;

        g.clear();
        g.scale.x = facingRight ? 1 : -1;

        // shadow
        g.beginFill(0x000000, 0.25);
        g.drawEllipse(0, 0, 13, 6);
        g.endFill();

        // legs
        if (this.sitting) {
            g.beginFill(pants);
            g.drawRect(-6, -18, 12, 6);
            g.drawRect(facingViewer ? 1 : -6, -18, 5, 14);
            g.endFill();
        } else {
            g.beginFill(shade(pants, -20));
            g.drawRect(-6, -18 + Math.max(0, -swing) / 2, 5, 18 - Math.max(0, -swing) / 2);
            g.endFill();
            g.beginFill(pants);
            g.drawRect(1, -18 + Math.max(0, swing) / 2, 5, 18 - Math.max(0, swing) / 2);
            g.endFill();
            g.beginFill(0x222222);
            g.drawRect(-7, -3, 6, 3);
            g.drawRect(1, -3, 6, 3);
            g.endFill();
        }

        const top = -lift;
        // back arm
        g.beginFill(shade(shirt, -35));
        g.drawRoundedRect(-11, top - 38 - swing / 2, 5, 16, 2);
        g.endFill();

        // torso
        g.beginFill(shirt);
        g.drawRoundedRect(-8, top - 40, 16, 23, 3);
        g.endFill();

        // front arm (raised when the hand is up)
        g.beginFill(shade(shirt, 15));
        if (this.occupant.handRaised) {
            g.drawRoundedRect(7, top - 56, 5, 18, 2);
            g.endFill();
            g.beginFill(skin);
            g.drawCircle(9.5, top - 57, 3);
        } else {
            g.drawRoundedRect(6, top - 38 + swing / 2, 5, 16, 2);
            g.endFill();
            g.beginFill(skin);
            g.drawCircle(8.5, top - 21 + swing / 2, 2.5);
        }
        g.endFill();

        // head
        g.beginFill(skin);
        g.drawRoundedRect(-8, top - 58, 17, 18, 6);
        g.endFill();

        // hair
        g.beginFill(hair);
        if (facingViewer) {
            g.drawRoundedRect(-9, top - 61, 19, 8, 4);
            g.drawRect(-9, top - 56, 5, 8);
        } else {
            g.drawRoundedRect(-9, top - 61, 19, 19, 6);
        }
        g.endFill();

        if (facingViewer) {
            // eyes and mouth, drawn toward the facing side
            g.beginFill(0x1b1b1b);
            g.drawRect(1, top - 51, 2, 3);
            g.drawRect(5, top - 51, 2, 3);
            g.endFill();
            g.beginFill(shade(skin, -60));
            g.drawRect(3, top - 45, 4, 1.5);
            g.endFill();
        }

        this.label.position.y = top - 64;
        this.hand.visible = this.occupant.handRaised;
        this.hand.position.set(this.label.width / 2 + 9, top - 62);
    }
}
