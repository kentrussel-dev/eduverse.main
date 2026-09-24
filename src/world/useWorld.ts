import { useCallback, useEffect, useRef, useState } from 'react';
import { RoomScene } from './RoomScene';
import { hubErrorMessage, WorldClient } from './worldClient';
import { ChatMessage, Occupant, Profile, RoomSnapshot, RoomSummary } from './types';

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
        const list = await run((c) => c.getRooms());
        if (list) setRooms(list);
    }, [run]);

    const enterRoom = useCallback(
        async (roomId: string) => {
            const snapshot = await run((c) => c.joinRoom(roomId));
            if (!snapshot) return false;
            setRoom(snapshot);
            setOccupants(Object.fromEntries(snapshot.occupants.map((o) => [o.id, o])));
            setChat(snapshot.chat);
            setWhiteboard(snapshot.whiteboard);
            setQuietMode(snapshot.quietMode);
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
        client.on('chatCleared', () => setChat([]));
        client.on('whiteboard', (text: string) => {
            setWhiteboard(text);
            sceneRef.current?.setWhiteboard(text);
        });
        client.on('roomSettings', (settings: { quietMode: boolean }) => {
            setQuietMode(settings.quietMode);
            setNotice({ text: settings.quietMode ? 'Quiet mode is on. Only the teacher can chat.' : 'Quiet mode is off.', severity: 'info' });
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
                await client.start();
                if (disposed) return;
                setStatus('connected');
                setProfile(await client.getProfile());
                setRooms(await client.getRooms());
                const snapshot = await client.joinRoom('lobby');
                setRoom(snapshot);
                setOccupants(Object.fromEntries(snapshot.occupants.map((o) => [o.id, o])));
                setChat(snapshot.chat);
                setWhiteboard(snapshot.whiteboard);
                setQuietMode(snapshot.quietMode);
                setRooms(await client.getRooms());
            } catch (error) {
                if (!disposed) {
                    setStatus('disconnected');
                    showError(error);
                }
            }
        })();

        // Keep the room list's player counts fresh.
        const poll = window.setInterval(async () => {
            if (client.connected) {
                try {
                    setRooms(await client.getRooms());
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
        room,
        occupants,
        chat,
        whiteboard,
        quietMode,
        notice,
        setNotice,
        run,
        refreshRooms,
        enterRoom,
    };
};
