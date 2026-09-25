import { useCallback, useEffect, useRef, useState } from 'react';
import { RoomScene } from './RoomScene';
import { authService, tokenStore } from '../services/auth.service';
import { hubErrorMessage, WorldClient } from './worldClient';
import { CatalogItem, ChatMessage, FurniItem, Occupant, Profile, RoomBan, RoomKind, RoomSnapshot, RoomSummary } from './types';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/**
 * Owns the connection to the world server and the React-side state of the current room.
 * The PixiJS scene is updated directly through sceneRef so animation doesn't re-render React.
 */
export const useWorld = () => {
    const clientRef = useRef<WorldClient | null>(null);
    const sceneRef = useRef<RoomScene | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [rooms, setRooms] = useState<RoomSummary[]>([]);
    const [room, setRoom] = useState<RoomSnapshot | null>(null);
    const [occupants, setOccupants] = useState<Record<string, Occupant>>({});
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [whiteboard, setWhiteboard] = useState('');
    const [quietMode, setQuietMode] = useState(false);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [bans, setBans] = useState<RoomBan[]>([]);
    const [roomTab, setRoomTab] = useState('public');
    const [roomQuery, setRoomQuery] = useState('');
    const listRef = useRef({ tab: 'public', query: '' });
    listRef.current = { tab: roomTab, query: roomQuery };
    const [notice, setNotice] = useState<{ text: string; severity: 'info' | 'error' | 'warning' } | null>(null);

    const showError = useCallback((error: unknown) => {
        setNotice({ text: hubErrorMessage(error), severity: 'error' });
    }, []);

    /** Runs a server call, turning failures into a notice. */
    const run = useCallback(
        async <T,>(action: (client: WorldClient) => Promise<T>): Promise<T | undefined> => {
            const client = clientRef.current;
            if (!client?.connected) {
                setNotice({ text: 'Not connected to the server yet.', severity: 'warning' });
                return undefined;
            }
            try {
                return await action(client);
            } catch (error) {
                showError(error);
                return undefined;
            }
        },
        [showError],
    );

    const refreshRooms = useCallback(async () => {
        const { tab, query } = listRef.current;
        const list = await run((c) => c.getRooms(tab, query));
        if (list) setRooms(list);
    }, [run]);

    // Reload the room finder when its tab or search changes (search waits for typing to pause).
    useEffect(() => {
        if (status !== 'connected') return undefined;
        const timer = window.setTimeout(refreshRooms, roomQuery ? 300 : 0);
        return () => window.clearTimeout(timer);
    }, [roomTab, roomQuery, status, refreshRooms]);

    const enterRoom = useCallback(
        async (roomId: string) => {
            const snapshot = await run((c) => c.joinRoom(roomId));
            if (!snapshot) return false;
            setRoom(snapshot);
            setOccupants(Object.fromEntries(snapshot.occupants.map((o) => [o.id, o])));
            setChat(snapshot.chat);
            setWhiteboard(snapshot.whiteboard);
            setQuietMode(snapshot.quietMode);
            setBans(snapshot.bans);
            refreshRooms();
            return true;
        },
        [run, refreshRooms],
    );

    useEffect(() => {
        const client = new WorldClient();
        clientRef.current = client;
        let disposed = false;

        client.on('userJoined', (o: Occupant) => {
            setOccupants((prev) => ({ ...prev, [o.id]: o }));
            sceneRef.current?.addOccupant(o);
        });
        client.on('userLeft', (id: string) => {
            setOccupants((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            sceneRef.current?.removeOccupant(id);
        });
        client.on('userMoved', (id: string, path: number[][]) => {
            sceneRef.current?.moveOccupant(id, path);
        });
        client.on('userUpdated', (o: Occupant) => {
            setOccupants((prev) => (prev[o.id] ? { ...prev, [o.id]: { ...o } } : prev));
            sceneRef.current?.updateOccupant(o);
        });
        client.on('chat', (message: ChatMessage) => {
            setChat((prev) => [...prev.slice(-199), message]);
            sceneRef.current?.showChat(message);
        });
        client.on('whisper', (message: ChatMessage) => {
            setChat((prev) => [...prev.slice(-199), message]);
            sceneRef.current?.showChat(message);
        });
        client.on('emote', (id: string, emoji: string) => sceneRef.current?.emote(id, emoji));
        client.on('wave', (id: string) => sceneRef.current?.wave(id));
        client.on('furniAdded', (item: FurniItem) => sceneRef.current?.addFurni(item));
        client.on('furniUpdated', (item: FurniItem) => sceneRef.current?.updateFurni(item));
        client.on('furniRemoved', (id: string) => sceneRef.current?.removeFurni(id));
        client.on('profile', (p: Profile) => setProfile(p));
        client.on('roomUpdated', (info: { name: string; description: string; kind: RoomKind; maxUsers: number }) => {
            setRoom((prev) => (prev ? { ...prev, ...info } : prev));
        });
        client.on('chatCleared', () => setChat([]));
        client.on('whiteboard', (text: string) => {
            setWhiteboard(text);
            sceneRef.current?.setWhiteboard(text);
        });
        client.on('boardUpdated', (_scene: string, preview: string) => sceneRef.current?.setBoardPicture(preview));
        client.on('roomSettings', (settings: { quietMode?: boolean; bans?: RoomBan[] }) => {
            if (settings.bans) setBans(settings.bans);
            if (settings.quietMode !== undefined) {
                setQuietMode(settings.quietMode);
                setNotice({ text: settings.quietMode ? 'Quiet mode is on. Only the teacher can chat.' : 'Quiet mode is off.', severity: 'info' });
            }
        });
        client.on('notice', (text: string) => setNotice({ text, severity: 'info' }));
        client.on('kicked', (reason: string) => {
            setRoom(null);
            setOccupants({});
            setChat([]);
            setNotice({ text: reason, severity: 'warning' });
        });

        client.connection.onreconnecting(() => setStatus('reconnecting'));
        client.connection.onreconnected(() => {
            // A new connection starts outside any room.
            setStatus('connected');
            setRoom(null);
            setNotice({ text: 'Reconnected. Pick a room to continue.', severity: 'info' });
        });
        client.connection.onclose(() => setStatus('disconnected'));

        (async () => {
            try {
                try {
                    await client.start();
                } catch (error) {
                    if (disposed || !String(error).includes('401')) throw error;
                    // The saved token was rejected or missing. Ask the API for a fresh one
                    // (works while the site session is still valid), then try once more.
                    const fresh = await authService.checkAuthStatus();
                    if (disposed || !fresh?.token) throw error;
                    await client.start();
                }
                if (disposed) return;
                setStatus('connected');
                setProfile(await client.getProfile());
                setCatalog(await client.getCatalog());
                const snapshot = await client.joinRoom('lobby');
                setRoom(snapshot);
                setOccupants(Object.fromEntries(snapshot.occupants.map((o) => [o.id, o])));
                setChat(snapshot.chat);
                setWhiteboard(snapshot.whiteboard);
                setQuietMode(snapshot.quietMode);
                setRooms(await client.getRooms(listRef.current.tab, listRef.current.query));
            } catch (error) {
                if (disposed) return;
                // The saved sign-in token was rejected (expired, or the server's key changed): sign in again.
                if (String(error).includes('401')) {
                    console.warn('The world server rejected the sign-in token. The server window logs the reason.', error);
                    tokenStore.clear();
                    window.location.assign(`/login?error=${encodeURIComponent('Please sign in again to enter the world.')}`);
                    return;
                }
                setStatus('disconnected');
                showError(error);
            }
        })();

        // Keep the room list's player counts fresh.
        const poll = window.setInterval(async () => {
            if (client.connected) {
                try {
                    setRooms(await client.getRooms(listRef.current.tab, listRef.current.query));
                } catch {
                    // ignore; the next poll will retry
                }
            }
        }, 15000);

        return () => {
            disposed = true;
            window.clearInterval(poll);
            client.stop();
        };
    }, [showError]);

    return {
        client: clientRef,
        sceneRef,
        status,
        profile,
        setProfile,
        rooms,
        roomTab,
        setRoomTab,
        roomQuery,
        setRoomQuery,
        catalog,
        bans,
        room,
        setRoom,
        occupants,
        chat,
        whiteboard,
        quietMode,
        notice,
        setNotice,
        run,
        clientRef,
        refreshRooms,
        enterRoom,
    };
};
