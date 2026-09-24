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
    shirt: string;
    pants: string;
}

export interface FurniItem {
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
}

export interface ChatMessage {
    fromId: string;
    name: string;
    text: string;
    sentAt: string;
    system?: boolean;
}

export interface RoomSummary {
    id: string;
    name: string;
    description: string;
    kind: RoomKind;
    ownerName: string;
    userCount: number;
    maxUsers: number;
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
}

export interface Profile {
    userId: string;
    name: string;
    isTeacher: boolean;
    look: AvatarLook;
}

export interface CreateRoomRequest {
    name: string;
    description: string;
    kind: RoomKind;
    template: 'classroom' | 'study_hall' | 'lounge' | 'empty';
}
