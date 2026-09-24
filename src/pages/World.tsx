import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert, Badge, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
    Drawer, FormControlLabel, IconButton, List, ListItemButton, ListItemText, Paper, Snackbar, Stack, Switch, Tab, Tabs,
    TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuIcon from '@mui/icons-material/Menu';
import PanToolIcon from '@mui/icons-material/PanTool';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { RoomScene } from '../world/RoomScene';
import { useWorld } from '../world/useWorld';
import { AvatarEditor } from '../world/ui/AvatarEditor';
import { CreateRoomDialog } from '../world/ui/CreateRoomDialog';
import { AvatarLook, Occupant, RoomKind, roomKindLabel, RoomSummary } from '../world/types';

// The app bar is 56px tall on phones and 64px from "sm" up. On phones the page isn't padded below it.
const pageSx = {
    mt: { xs: '56px', sm: 0 },
    height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
};

const kindColor: Record<RoomKind, 'default' | 'primary' | 'secondary' | 'success' | 'warning'> = {
    [RoomKind.Lobby]: 'primary',
    [RoomKind.Public]: 'secondary',
    [RoomKind.Classroom]: 'warning',
    [RoomKind.Study]: 'success',
    [RoomKind.Private]: 'default',
};

export const World = () => {
    const world = useWorld();
    const { room, occupants, profile, status, run, sceneRef } = world;
    const theme = useTheme();
    const wide = useMediaQuery(theme.breakpoints.up('md'));
    const canvasHost = useRef<HTMLDivElement>(null);

    const [navOpen, setNavOpen] = useState(false);
    const [tab, setTab] = useState(0);
    const [message, setMessage] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [boardDraft, setBoardDraft] = useState('');

    const me = room ? occupants[room.youId] : undefined;
    const isHost = Boolean(room?.youAreHost);
    const isClassroom = room?.kind === RoomKind.Classroom;
    const selected = selectedId ? occupants[selectedId] : undefined;
    const people = useMemo(
        () => Object.values(occupants).sort((a, b) => Number(b.isHost) - Number(a.isHost) || Number(b.handRaised) - Number(a.handRaised) || a.name.localeCompare(b.name)),
        [occupants],
    );
    const raisedHands = people.filter((p) => p.handRaised).length;
    const showClassTab = isClassroom || isHost;

    useEffect(() => {
        if (tab === 2 && !showClassTab) setTab(0);
    }, [tab, showClassTab]);

    // Build a fresh PixiJS scene whenever we enter a room.
    useEffect(() => {
        if (!room || !canvasHost.current) return undefined;
        const scene = new RoomScene(canvasHost.current, room, {
            onTileClick: (x, y) => {
                run((c) => c.move(x, y));
            },
            onAvatarClick: (id) => {
                setSelectedId(id);
                setReportReason('');
            },
        });
        sceneRef.current = scene;
        setBoardDraft(room.whiteboard);
        return () => {
            sceneRef.current = null;
            scene.destroy();
        };
        // Only rebuild on room change; live updates go straight to the scene.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.id, room?.youId]);

    const chatEnd = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEnd.current?.scrollIntoView({ block: 'end' });
    }, [world.chat, tab]);

    const send = async () => {
        const text = message.trim();
        if (!text) return;
        setMessage('');
        await run((c) => c.say(text));
    };

    const join = async (id: string) => {
        if (await world.enterRoom(id)) {
            setNavOpen(false);
            setRoomCode('');
        }
    };

    const saveLook = async (look: AvatarLook) => {
        await run((c) => c.setLook(look));
        world.setProfile((p) => (p ? { ...p, look } : p));
        setAvatarOpen(false);
    };

    const copyCode = () => {
        if (room) {
            navigator.clipboard?.writeText(room.id);
            world.setNotice({ text: `Room code ${room.id} copied.`, severity: 'info' });
        }
    };

    // ---- panels ----

    const navigatorPanel = (
        <Box sx={{ width: 280, p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflow: 'auto' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Rooms</Typography>
                <IconButton size="small" onClick={world.refreshRooms} aria-label="Refresh rooms">
                    <RefreshIcon fontSize="small" />
                </IconButton>
            </Stack>
            <List dense disablePadding>
                {world.rooms.map((r: RoomSummary) => (
                    <ListItemButton key={r.id} selected={room?.id === r.id} onClick={() => join(r.id)} sx={{ borderRadius: 1, mb: 0.5 }}>
                        <ListItemText
                            primary={r.name}
                            secondary={r.description || `by ${r.ownerName}`}
                            secondaryTypographyProps={{ noWrap: true }}
                        />
                        <Stack alignItems="flex-end" spacing={0.5} ml={1}>
                            <Chip size="small" label={roomKindLabel[r.kind]} color={kindColor[r.kind]} />
                            <Typography variant="caption" color="text.secondary">
                                {r.userCount}/{r.maxUsers}
                            </Typography>
                        </Stack>
                    </ListItemButton>
                ))}
            </List>
            <Divider />
            <Typography variant="subtitle2">Join with a room code</Typography>
            <Stack direction="row" spacing={1}>
                <TextField
                    size="small"
                    placeholder="e.g. K7M2QX"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && roomCode.trim() && join(roomCode.trim())}
                    inputProps={{ maxLength: 20 }}
                />
                <Button variant="outlined" disabled={!roomCode.trim()} onClick={() => join(roomCode.trim())}>
                    Go
                </Button>
            </Stack>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                {profile?.isTeacher ? 'Create classroom or room' : 'Create a room'}
            </Button>
        </Box>
    );

    const chatLog = (
        <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
            {world.chat.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                    No messages yet. Say hi!
                </Typography>
            )}
            {world.chat.map((m, i) => (
                <Typography key={`${m.sentAt}-${i}`} variant="body2" sx={{ mb: 0.75, wordBreak: 'break-word' }}>
                    <Box component="span" sx={{ color: 'text.secondary', fontSize: 11, mr: 1 }}>
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Box>
                    <Box component="span" sx={{ fontWeight: 700, color: occupants[m.fromId]?.isHost ? 'warning.light' : 'primary.light' }}>
                        {m.name}:
                    </Box>{' '}
                    {m.text}
                </Typography>
            ))}
            <div ref={chatEnd} />
        </Box>
    );

    const peopleList = (
        <List dense sx={{ flex: 1, overflow: 'auto' }}>
            {people.map((p: Occupant) => (
                <ListItemButton key={p.id} onClick={() => setSelectedId(p.id)}>
                    <ListItemText
                        primary={`${p.name}${p.id === room?.youId ? ' (you)' : ''}`}
                        secondary={[p.isHost ? 'Host' : p.isTeacher ? 'Teacher' : 'Student', p.muted ? 'muted' : ''].filter(Boolean).join(' · ')}
                    />
                    {p.handRaised && <PanToolIcon fontSize="small" color="warning" />}
                </ListItemButton>
            ))}
        </List>
    );

    const classPanel = (
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle2">Whiteboard</Typography>
            {isHost ? (
                <>
                    <TextField
                        multiline
                        minRows={4}
                        maxRows={10}
                        value={boardDraft}
                        onChange={(e) => setBoardDraft(e.target.value)}
                        placeholder="Today's lesson, homework, or a question for the class"
                        inputProps={{ maxLength: 2000 }}
                    />
                    <Button variant="contained" onClick={() => run((c) => c.setWhiteboard(boardDraft))}>
                        Update whiteboard
                    </Button>
                    <Divider />
                    <Typography variant="subtitle2">Class controls</Typography>
                    <FormControlLabel
                        control={<Switch checked={world.quietMode} onChange={(e) => run((c) => c.setQuietMode(e.target.checked))} />}
                        label="Quiet mode (only hosts can chat)"
                    />
                    <Button variant="outlined" color="warning" onClick={() => run((c) => c.clearChat())}>
                        Clear chat for everyone
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        Click a student (in the room or the People tab) to mute or remove them.
                        Share room code <b>{room?.id}</b> so students can join.
                    </Typography>
                </>
            ) : (
                <Paper variant="outlined" sx={{ p: 1.5, whiteSpace: 'pre-wrap', bgcolor: '#f8f9fa', color: '#1d3557', minHeight: 120 }}>
                    {world.whiteboard || 'The teacher hasn’t written anything yet.'}
                </Paper>
            )}
        </Box>
    );

    const sidePanel = (
        <Paper square sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                <Tab label="Chat" />
                <Tab label={<Badge badgeContent={raisedHands} color="warning">People ({people.length})</Badge>} />
                {showClassTab && <Tab label="Class" />}
            </Tabs>
            {tab === 0 && chatLog}
            {tab === 1 && peopleList}
            {tab === 2 && classPanel}
        </Paper>
    );

    // ---- layout ----

    if (status === 'connecting' && !room) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2} sx={pageSx}>
                <CircularProgress />
                <Typography color="text.secondary">Connecting to EduVerse…</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ ...pageSx, display: 'flex', flexDirection: wide ? 'row' : 'column', overflow: 'hidden' }}>
            {wide ? (
                <Paper square sx={{ flexShrink: 0, borderRight: 1, borderColor: 'divider' }}>{navigatorPanel}</Paper>
            ) : (
                <Drawer open={navOpen} onClose={() => setNavOpen(false)}>{navigatorPanel}</Drawer>
            )}

            <Box sx={{ position: 'relative', flex: wide ? 1 : '0 0 58%', minWidth: 0, minHeight: 0 }}>
                <Box ref={canvasHost} sx={{ position: 'absolute', inset: 0, touchAction: 'none' }} />

                {!room && status !== 'connecting' && (
                    <Box position="absolute" sx={{ inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                        <Typography color="text.secondary">
                            {status === 'disconnected' ? 'Disconnected from the server.' : 'You are not in a room.'}
                        </Typography>
                        {status === 'disconnected' ? (
                            <Button variant="contained" onClick={() => window.location.reload()}>Reconnect</Button>
                        ) : (
                            <Button variant="contained" onClick={() => join('lobby')}>Go to the Main Hall</Button>
                        )}
                    </Box>
                )}

                {room && (
                    <Paper sx={{ position: 'absolute', top: 12, left: 12, right: 12, px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(20,20,35,0.85)' }}>
                        {!wide && (
                            <IconButton size="small" onClick={() => setNavOpen(true)} aria-label="Rooms">
                                <MenuIcon />
                            </IconButton>
                        )}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="subtitle1" noWrap fontWeight={700}>{room.name}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap component="div">
                                {room.description || `${roomKindLabel[room.kind]} by ${room.ownerName}`}
                            </Typography>
                        </Box>
                        {world.quietMode && <Chip size="small" color="warning" label="Quiet mode" />}
                        {/^[A-Z0-9]{6}$/.test(room.id) && (
                            <Tooltip title="Copy room code">
                                <Chip size="small" icon={<ContentCopyIcon />} label={room.id} onClick={copyCode} />
                            </Tooltip>
                        )}
                        {status === 'reconnecting' && <Chip size="small" color="error" label="Reconnecting…" />}
                    </Paper>
                )}

                {room && (
                    <Stack spacing={1} sx={{ position: 'absolute', right: 12, top: 80 }}>
                        <IconButton sx={{ bgcolor: 'rgba(20,20,35,0.85)' }} onClick={() => sceneRef.current?.zoom(1.2)} aria-label="Zoom in"><ZoomInIcon /></IconButton>
                        <IconButton sx={{ bgcolor: 'rgba(20,20,35,0.85)' }} onClick={() => sceneRef.current?.zoom(1 / 1.2)} aria-label="Zoom out"><ZoomOutIcon /></IconButton>
                    </Stack>
                )}

                {room && (
                    <Paper sx={{ position: 'absolute', bottom: 12, left: 12, right: 12, p: 1, display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'rgba(20,20,35,0.9)' }}>
                        <Tooltip title="Change your look">
                            <IconButton onClick={() => setAvatarOpen(true)} aria-label="Customize avatar"><CheckroomIcon /></IconButton>
                        </Tooltip>
                        {isClassroom && !isHost && (
                            <Tooltip title={me?.handRaised ? 'Lower your hand' : 'Raise your hand'}>
                                <IconButton color={me?.handRaised ? 'warning' : 'default'} onClick={() => run((c) => c.raiseHand(!me?.handRaised))} aria-label="Raise hand">
                                    <PanToolIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <TextField
                            size="small"
                            fullWidth
                            placeholder={me?.muted ? 'You are muted' : world.quietMode && !isHost ? 'Quiet mode: raise your hand' : 'Say something…'}
                            value={message}
                            disabled={me?.muted || (world.quietMode && !isHost)}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && send()}
                            inputProps={{ maxLength: 200, 'aria-label': 'Chat message' }}
                        />
                        <IconButton color="primary" onClick={send} disabled={!message.trim()} aria-label="Send"><SendIcon /></IconButton>
                    </Paper>
                )}
            </Box>

            <Box sx={{ width: wide ? 320 : '100%', flex: wide ? '0 0 320px' : 1, minHeight: 0, borderLeft: wide ? 1 : 0, borderColor: 'divider' }}>
                {sidePanel}
            </Box>

            <CreateRoomDialog
                open={createOpen}
                isTeacher={Boolean(profile?.isTeacher)}
                onClose={() => setCreateOpen(false)}
                onCreate={async (request) => {
                    const created = await run((c) => c.createRoom(request));
                    if (created) {
                        setCreateOpen(false);
                        await join(created.id);
                        world.setNotice({ text: `Room created! Room code: ${created.id}`, severity: 'info' });
                    }
                }}
            />

            {profile && (
                <AvatarEditor open={avatarOpen} look={profile.look} onClose={() => setAvatarOpen(false)} onSave={saveLook} />
            )}

            <Dialog open={Boolean(selected)} onClose={() => setSelectedId(null)} maxWidth="xs" fullWidth>
                {selected && (
                    <>
                        <DialogTitle>
                            {selected.name}
                            <Typography variant="body2" color="text.secondary">
                                {selected.isHost ? 'Host' : selected.isTeacher ? 'Teacher' : 'Student'}
                                {selected.muted ? ' · muted' : ''}
                                {selected.handRaised ? ' · hand raised ✋' : ''}
                            </Typography>
                        </DialogTitle>
                        {selected.id !== room?.youId && (
                            <DialogContent>
                                <Typography variant="body2" gutterBottom>
                                    Is this person being mean or unsafe? Tell a moderator.
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="What happened? (optional)"
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    inputProps={{ maxLength: 300 }}
                                />
                            </DialogContent>
                        )}
                        <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
                            {selected.id !== room?.youId && isHost && !selected.isHost && (
                                <>
                                    <Button onClick={() => run((c) => c.mute(selected.id, !selected.muted))}>
                                        {selected.muted ? 'Unmute' : 'Mute'}
                                    </Button>
                                    <Button color="warning" onClick={() => { run((c) => c.kick(selected.id)); setSelectedId(null); }}>
                                        Remove from room
                                    </Button>
                                </>
                            )}
                            {selected.id !== room?.youId && (
                                <Button color="error" onClick={() => { run((c) => c.report(selected.id, reportReason)); setSelectedId(null); }}>
                                    Report
                                </Button>
                            )}
                            <Button onClick={() => setSelectedId(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <Snackbar
                open={Boolean(world.notice)}
                autoHideDuration={5000}
                onClose={() => world.setNotice(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                {world.notice ? (
                    <Alert severity={world.notice.severity} onClose={() => world.setNotice(null)} variant="filled">
                        {world.notice.text}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </Box>
    );
};
