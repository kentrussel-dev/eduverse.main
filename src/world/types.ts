// Shapes of the data the world server (eduverse.server /hubs/world) sends and receives.

export enum RoomKind {
    Lobby = 0,
    Public = 1,
    Classroom = 2,
    Study = 3,
    Private = 4,
}

export const roomKindLabel: Record<RoomKind, string> = {
    [RoomKind.Lobby]: 'Lobby',
    [RoomKind.Public]: 'Hangout',
    [RoomKind.Classroom]: 'Classroom',
    [RoomKind.Study]: 'Study room',
    [RoomKind.Private]: 'Private',
};

export type Dir = 'ne' | 'nw' | 'se' | 'sw';

export interface AvatarLook {
    skin: string;
    hair: string;
    hairStyle: string;
    top: string;
    shirt: string;
    bottom: string;
    pants: string;
    shoes: string;
    hat: string;
    hatColor: string;
    /** 'boy' or 'girl': which clothes the character editor shows. */
    gender?: 'boy' | 'girl';
}

export const defaultLook: AvatarLook = {
    skin: '#f1c27d',
    hair: '#4a3021',
    hairStyle: 'short',
    top: 'tshirt',
    shirt: '#3f7fd9',
    bottom: 'pants',
    pants: '#2d3a4a',
    shoes: '#333333',
    hat: 'none',
    hatColor: '#e63946',
};

export interface FurniItem {
    id: string;
    type: string;
    x: number;
    y: number;
    dir: Dir;
}

export interface Occupant {
    id: string;
    userId: string;
    name: string;
    isTeacher: boolean;
    isHost: boolean;
    look: AvatarLook;
    x: number;
    y: number;
    muted: boolean;
    handRaised: boolean;
    dance: number;
    sittingOnFloor: boolean;
    /** Tiles still to walk, for people who were mid-walk when you arrived. */
    walkingTo?: number[][];
}

export interface ChatMessage {
    fromId: string;
    name: string;
    text: string;
    sentAt: string;
    system?: boolean;
    /** Set on whispers: the name of the person whispered to. */
    whisperTo?: string | null;
}

export interface RoomSummary {
    id: string;
    name: string;
    description: string;
    kind: RoomKind;
    ownerName: string;
    userCount: number;
    maxUsers: number;
    isYours: boolean;
}

export interface RoomBan {
    userId: string;
    name: string;
}

export interface RoomSnapshot {
    id: string;
    name: string;
    description: string;
    kind: RoomKind;
    ownerName: string;
    layout: string[];
    doorX: number;
    doorY: number;
    furni: FurniItem[];
    occupants: Occupant[];
    chat: ChatMessage[];
    whiteboard: string;
    quietMode: boolean;
    youId: string;
    youAreHost: boolean;
    youAreOwner: boolean;
    maxUsers: number;
    bans: RoomBan[];
}

export interface Profile {
    userId: string;
    name: string;
    isTeacher: boolean;
    look: AvatarLook;
    coins: number;
    /** Furni type → count in inventory. */
    furni: Record<string, number>;
    /** Owned clothing catalog ids. */
    clothing: string[];
    dailyBonusAvailable: boolean;
}

export enum CatalogKind {
    Furni = 0,
    Clothing = 1,
}

export interface CatalogItem {
    id: string;
    name: string;
    kind: CatalogKind;
    price: number;
    category: string;
    slot?: string | null;
    value?: string | null;
}

export interface RoomSettings {
    name: string;
    description: string;
    kind: RoomKind;
    maxUsers: number;
}

export const EMOTES = ['❤️', '😂', '😮', '😢', '👍', '👏', '🎉', '⭐', '🤔', '😴', '📚', '✅'];

export const DANCES = [
    { style: 1, label: 'Hab Dance' },
    { style: 2, label: 'Pogo' },
    { style: 3, label: 'Duck Funk' },
    { style: 4, label: 'Rollie' },
];

export interface CreateRoomRequest {
    name: string;
    description: string;
    kind: RoomKind;
    template: 'apartment' | 'house' | 'classroom' | 'study_hall' | 'lounge' | 'empty';
}
