import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { tokenStore } from '../services/auth.service';
import { AvatarLook, CreateRoomRequest, Profile, RoomSnapshot, RoomSummary } from './types';

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
    getRooms = () => this.connection.invoke<RoomSummary[]>('GetRooms');
    createRoom = (request: CreateRoomRequest) => this.connection.invoke<RoomSummary>('CreateRoom', request);
    joinRoom = (roomId: string) => this.connection.invoke<RoomSnapshot>('JoinRoom', roomId);
    leaveRoom = () => this.connection.invoke('LeaveRoom');
    move = (x: number, y: number) => this.connection.invoke('Move', x, y);
    say = (text: string) => this.connection.invoke('Say', text);
    raiseHand = (raised: boolean) => this.connection.invoke('RaiseHand', raised);
    setLook = (look: AvatarLook) => this.connection.invoke('SetLook', look);
    report = (targetId: string, reason: string) => this.connection.invoke('Report', targetId, reason);

    // Host tools
    mute = (targetId: string, muted: boolean) => this.connection.invoke('Mute', targetId, muted);
    kick = (targetId: string) => this.connection.invoke('Kick', targetId);
    setWhiteboard = (text: string) => this.connection.invoke('SetWhiteboard', text);
    setQuietMode = (quiet: boolean) => this.connection.invoke('SetQuietMode', quiet);
    clearChat = () => this.connection.invoke('ClearChat');
}
