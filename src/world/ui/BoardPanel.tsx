import { useEffect, useRef, useState } from 'react';
import { Box, Button, Switch, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { habbo } from './habboTheme';
import { loadExcalidraw } from './excalidrawLoader';
import { hubErrorMessage, WorldClient } from '../worldClient';
import { BoardState, Occupant } from '../types';

interface Props {
    client: WorldClient;
    youId: string;
    isHost: boolean;
    occupants: Occupant[];
    onClose: () => void;
}

const SEND_EVERY_MS = 400;

const toDataUrl = (blob: Blob) =>
    new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
    });

/**
 * The classroom board: a shared Excalidraw canvas docked on the right half of the screen.
 * Hosts (teachers and room owners) can always draw and decide who else may; everyone else
 * watches. Each drawer also sends a small picture that shows on the whiteboard in the room.
 */
export const BoardPanel = ({ client, youId, isHost, occupants, onClose }: Props) => {
    const [lib, setLib] = useState<any>(null);
    const [board, setBoard] = useState<BoardState | null>(null);
    const [error, setError] = useState('');
    const apiRef = useRef<any>(null);
    const lastScene = useRef('');
    const timer = useRef<number | null>(null);
    const pending = useRef<{ elements: readonly any[]; files: any } | null>(null);

    const canDraw = isHost || Boolean(board && (board.everyone || board.drawers.includes(youId)));

    useEffect(() => {
        let alive = true;
        Promise.all([loadExcalidraw(), client.getBoard()])
            .then(([excalidraw, state]) => {
                if (!alive) return;
                lastScene.current = state.scene;
                setBoard(state);
                setLib(excalidraw);
            })
            .catch((e) => alive && setError(hubErrorMessage(e)));
        const onUpdate = (scene: string) => {
            lastScene.current = scene;
            const elements = scene ? JSON.parse(scene).elements ?? [] : [];
            apiRef.current?.updateScene({ elements });
        };
        const onAccess = (access: { everyone: boolean; drawers: string[] }) =>
            setBoard((b) => (b ? { ...b, ...access } : b));
        client.connection.on('boardUpdated', onUpdate);
        client.connection.on('boardAccess', onAccess);
        return () => {
            alive = false;
            client.connection.off('boardUpdated', onUpdate);
            client.connection.off('boardAccess', onAccess);
            if (timer.current) window.clearTimeout(timer.current);
        };
    }, [client]);

    /** Sends the drawing (and a small picture for the wall) at most every SEND_EVERY_MS. */
    const send = async () => {
        timer.current = null;
        const next = pending.current;
        pending.current = null;
        if (!next || !lib) return;
        const scene = JSON.stringify({ elements: next.elements });
        if (scene === lastScene.current) return;
        lastScene.current = scene;
        let preview = '';
        try {
            const live = next.elements.filter((e: any) => !e.isDeleted);
            if (live.length) {
                const blob = await lib.exportToBlob({
                    elements: live,
                    appState: { exportBackground: true, viewBackgroundColor: '#ffffff' },
                    files: next.files,
                    maxWidthOrHeight: 320,
                    mimeType: 'image/png',
                });
                preview = await toDataUrl(blob);
            }
        } catch {
            preview = '';
        }
        client.updateBoard(scene, preview).catch((e) => setError(hubErrorMessage(e)));
    };

    const onChange = (elements: readonly any[], _appState: any, files: any) => {
        if (!canDraw) return;
        pending.current = { elements, files };
        if (!timer.current) timer.current = window.setTimeout(send, SEND_EVERY_MS);
    };

    const Excalidraw = lib?.Excalidraw;
    const initialElements = board?.scene ? JSON.parse(board.scene).elements ?? [] : [];
    const others = occupants.filter((o) => o.id !== youId && !o.isHost);

    return (
        <Box
            role="region"
            aria-label="Board"
            sx={{
                position: 'absolute', top: 0, right: 0, bottom: 0, width: { xs: '100%', md: '50%' }, zIndex: 20,
                display: 'flex', flexDirection: 'column', bgcolor: habbo.window, borderLeft: `2px solid ${habbo.border}`,
            }}
        >
            {/* Title bar, like the other Habbo windows */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, bgcolor: habbo.blue, color: '#fff' }}>
                <Typography fontWeight={700} fontSize={14} flex={1}>🧑‍🏫 Board</Typography>
                <Typography fontSize={12} sx={{ opacity: 0.9 }}>
                    {canDraw ? (isHost ? 'You control the board' : '✏️ You can draw') : '👀 Watching (ask your teacher to draw)'}
                </Typography>
                <Box component="button" aria-label="Close Board" onClick={onClose}
                    sx={{ bgcolor: '#c0392b', border: '1px solid #000', color: '#fff', borderRadius: '4px', width: 24, height: 22, display: 'grid', placeItems: 'center', cursor: 'pointer', p: 0 }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                </Box>
            </Box>

            {/* Teacher controls */}
            {isHost && board && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, bgcolor: habbo.windowDark, borderBottom: `1px solid ${habbo.border}` }}>
                    <Box component="label" sx={{ display: 'flex', alignItems: 'center', fontSize: 12.5, fontWeight: 700 }}>
                        <Switch size="small" checked={board.everyone} onChange={(e) => client.setBoardAccess(e.target.checked).catch((err) => setError(hubErrorMessage(err)))} inputProps={{ 'aria-label': 'Everyone can draw' }} />
                        Everyone can draw
                    </Box>
                    <Button size="small" variant="contained" color="error" onClick={() => client.clearBoard().then(() => apiRef.current?.updateScene({ elements: [] })).catch((err) => setError(hubErrorMessage(err)))}>
                        Clear board
                    </Button>
                    {!board.everyone && others.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', width: '100%' }}>
                            <Typography fontSize={12} color="text.secondary">Let draw:</Typography>
                            {others.map((o) => {
                                const allowed = board.drawers.includes(o.id);
                                return (
                                    <Tooltip key={o.id} title={allowed ? `Stop ${o.name} drawing` : `Let ${o.name} draw`}>
                                        <Box component="button" aria-label={`${allowed ? 'Stop' : 'Let'} ${o.name} draw`}
                                            onClick={() => client.allowBoardDrawer(o.id, !allowed).catch((err) => setError(hubErrorMessage(err)))}
                                            sx={{ fontSize: 12, fontWeight: 700, borderRadius: '10px', px: 1, py: 0.25, cursor: 'pointer',
                                                border: `1px solid ${habbo.border}`, bgcolor: allowed ? '#2ecc71' : '#ececec', color: allowed ? '#fff' : habbo.text }}>
                                            {allowed ? '✏️ ' : ''}{o.name}{o.handRaised ? ' ✋' : ''}
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            )}

            {error && (
                <Box sx={{ px: 1.5, py: 0.5, bgcolor: '#fdecea', color: '#b71c1c', fontSize: 12.5 }} onClick={() => setError('')}>{error}</Box>
            )}

            <Box sx={{ flex: 1, minHeight: 0, position: 'relative', bgcolor: '#fff' }}>
                {Excalidraw ? (
                    <Excalidraw
                        key={canDraw ? 'draw' : 'view'}
                        excalidrawAPI={(api: any) => { apiRef.current = api; }}
                        initialData={{ elements: initialElements, appState: { viewBackgroundColor: '#ffffff', currentItemStrokeWidth: 2 }, scrollToContent: true }}
                        viewModeEnabled={!canDraw}
                        onChange={onChange}
                        UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false, saveAsImage: false, toggleTheme: false }, tools: { image: false } }}
                    />
                ) : (
                    <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: habbo.text }}>{error ? 'The board could not open.' : 'Opening the board…'}</Box>
                )}
            </Box>
        </Box>
    );
};
