import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { tokenStore } from '../services/auth.service';
import { AvatarLook, BoardState, CatalogItem, CreateRoomRequest, Profile, RoomSettings, RoomSnapshot, RoomSummary } from './types';

// REACT_APP_API_URL points at ".../api"; the hub lives next to it at "/hubs/world".
const serverUrl = (process.env.REACT_APP_API_URL ?? 'http://localhost:5000/api').replace(/\/api\/?$/, '');

/** Pulls the readable message out of a SignalR HubException. */
export const hubErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const marker = 'HubException: ';
    const index = message.indexOf(marker);
    return index >= 0 ? message.slice(index + marker.length) : message;
};

/** Typed wrapper around the SignalR connection to the world server. */
export class WorldClient {
    readonly connection: HubConnection;

    constructor() {
        this.connection = new HubConnectionBuilder()
            .withUrl(`${serverUrl}/hubs/world`, { accessTokenFactory: () => tokenStore.get() ?? '' })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();
    }

    get connected() {
        return this.connection.state === HubConnectionState.Connected;
    }

    start = () => this.connection.start();
    stop = () => this.connection.stop();

    on(event: string, handler: (...args: any[]) => void) {
        this.connection.on(event, handler);
    }

    getProfile = () => this.connection.invoke<Profile>('GetProfile');
    getCatalog = () => this.connection.invoke<CatalogItem[]>('GetCatalog');
    buy = (itemId: string) => this.connection.invoke<Profile>('Buy', itemId);
    claimDailyBonus = () => this.connection.invoke<Profile>('ClaimDailyBonus');
    getRooms = (tab = 'public', query = '') => this.connection.invoke<RoomSummary[]>('GetRooms', tab, query);
    createRoom = (request: CreateRoomRequest) => this.connection.invoke<RoomSummary>('CreateRoom', request);
    joinRoom = (roomId: string) => this.connection.invoke<RoomSnapshot>('JoinRoom', roomId);
    leaveRoom = () => this.connection.invoke('LeaveRoom');
    move = (x: number, y: number) => this.connection.invoke('Move', x, y);
    say = (text: string) => this.connection.invoke('Say', text);
    whisper = (targetId: string, text: string) => this.connection.invoke('Whisper', targetId, text);
    dance = (style: number) => this.connection.invoke('Dance', style);
    sit = (sitting: boolean) => this.connection.invoke('Sit', sitting);
    wave = () => this.connection.invoke('Wave');
    emote = (emoji: string) => this.connection.invoke('Emote', emoji);
    raiseHand = (raised: boolean) => this.connection.invoke('RaiseHand', raised);
    setLook = (look: AvatarLook) => this.connection.invoke<Profile>('SetLook', look);
    report = (targetId: string, reason: string) => this.connection.invoke('Report', targetId, reason);

    // Room owner: building and settings
    placeFurni = (type: string, x: number, y: number, dir: string) => this.connection.invoke('PlaceFurni', type, x, y, dir);
    rotateFurni = (furniId: string) => this.connection.invoke('RotateFurni', furniId);
    pickUpAll = () => this.connection.invoke('PickUpAll');
    setRoomStyle = (wallpaper: string, floor: string) => this.connection.invoke('SetRoomStyle', wallpaper, floor);
    pickUpFurni = (furniId: string) => this.connection.invoke('PickUpFurni', furniId);
    updateRoomSettings = (settings: RoomSettings) => this.connection.invoke('UpdateRoomSettings', settings);
    deleteRoom = () => this.connection.invoke('DeleteRoom');
    unban = (userId: string) => this.connection.invoke('Unban', userId);

    // Host tools
    mute = (targetId: string, muted: boolean) => this.connection.invoke('Mute', targetId, muted);
    kick = (targetId: string, ban = false) => this.connection.invoke('Kick', targetId, ban);
    setWhiteboard = (text: string) => this.connection.invoke('SetWhiteboard', text);
    // The drawing board
    getBoard = () => this.connection.invoke<BoardState>('GetBoard');
    updateBoard = (scene: string, preview: string) => this.connection.invoke('UpdateBoard', scene, preview);
    clearBoard = () => this.connection.invoke('ClearBoard');
    setBoardAccess = (everyone: boolean) => this.connection.invoke('SetBoardAccess', everyone);
    allowBoardDrawer = (occupantId: string, allowed: boolean) => this.connection.invoke('AllowBoardDrawer', occupantId, allowed);
    setQuietMode = (quiet: boolean) => this.connection.invoke('SetQuietMode', quiet);
    clearChat = () => this.connection.invoke('ClearChat');
}
