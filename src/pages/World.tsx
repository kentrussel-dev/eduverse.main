import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert, Badge, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
    Drawer, FormControlLabel, IconButton, InputAdornment, List, ListItemButton, ListItemText, Menu, MenuItem, Paper,
    Popover, Snackbar, Stack, Switch, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChairIcon from '@mui/icons-material/Chair';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import ConstructionIcon from '@mui/icons-material/Construction';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MenuIcon from '@mui/icons-material/Menu';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PanToolIcon from '@mui/icons-material/PanTool';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { RoomScene } from '../world/RoomScene';
import { useWorld } from '../world/useWorld';
import { AvatarEditor } from '../world/ui/AvatarEditor';
import { BuildPanel } from '../world/ui/BuildPanel';
import { CreateRoomDialog } from '../world/ui/CreateRoomDialog';
import { RoomSettingsDialog } from '../world/ui/RoomSettingsDialog';
import { Coins, ShopDialog } from '../world/ui/ShopDialog';
import {
    AvatarLook, CatalogItem, DANCES, Dir, EMOTES, Occupant, RoomKind, roomKindLabel, RoomSummary,
} from '../world/types';

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

const CHAT_EMOJIS = ['😀', '😂', '😊', '😍', '😎', '🤩', '😢', '😡', '👍', '👋', '🙏', '💯', '🔥', '🎉', '📚', '✏️', '🧠', '⚽', '🎮', '🍕'];
const ROTATION: Dir[] = ['se', 'sw', 'nw', 'ne'];
const rotate = (dir: Dir) => ROTATION[(ROTATION.indexOf(dir) + 1) % ROTATION.length];

const overlay = 'rgba(20,20,35,0.88)';

export const World = () => {
    const world = useWorld();
    const { room, occupants, profile, status, run, sceneRef, catalog } = world;
    const theme = useTheme();
    const wide = useMediaQuery(theme.breakpoints.up('md'));
    const canvasHost = useRef<HTMLDivElement>(null);
    const chatInput = useRef<HTMLInputElement>(null);

    const [navOpen, setNavOpen] = useState(false);
    const [tab, setTab] = useState(0);
    const [message, setMessage] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [shopOpen, setShopOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [whisperText, setWhisperText] = useState('');
    const [boardDraft, setBoardDraft] = useState('');
    const [danceAnchor, setDanceAnchor] = useState<HTMLElement | null>(null);
    const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
    const [building, setBuilding] = useState(false);
    const [placing, setPlacing] = useState<{ type: string; dir: Dir } | null>(null);
    const [selectedFurni, setSelectedFurni] = useState<string | null>(null);

    const me = room ? occupants[room.youId] : undefined;
    const isHost = Boolean(room?.youAreHost);
    const isOwner = Boolean(room?.youAreOwner);
    const isClassroom = room?.kind === RoomKind.Classroom;
    const selected = selectedId ? occupants[selectedId] : undefined;
    const people = useMemo(
        () => Object.values(occupants).sort((a, b) => Number(b.isHost) - Number(a.isHost) || Number(b.handRaised) - Number(a.handRaised) || a.name.localeCompare(b.name)),
        [occupants],
    );
    const raisedHands = people.filter((p) => p.handRaised).length;
    const showClassTab = isClassroom || isHost;
    const canChat = !me?.muted && !(world.quietMode && !isHost);
    const selectedFurniType = selectedFurni ? sceneRef.current?.furniItem(selectedFurni)?.type : undefined;
    const selectedFurniName = selectedFurniType ? catalog.find((i) => i.id === selectedFurniType)?.name ?? selectedFurniType : null;

    useEffect(() => {
        if (tab === 2 && !showClassTab) setTab(0);
    }, [tab, showClassTab]);

    // The scene calls back into React; keep the latest placing state where its callbacks can read it.
    const placingRef = useRef(placing);
    placingRef.current = placing;

    // Build a fresh PixiJS scene whenever we enter a room.
    useEffect(() => {
        if (!room || !canvasHost.current) return undefined;
        setBuilding(false);
        setPlacing(null);
        setSelectedFurni(null);
        const scene = new RoomScene(canvasHost.current, room, {
            onTileClick: (x, y) => {
                run((c) => c.move(x, y));
            },
            onAvatarClick: (id) => {
                setSelectedId(id);
                setReportReason('');
                setWhisperText('');
            },
            onPlaceFurni: (x, y) => {
                const current = placingRef.current;
                if (current) run((c) => c.placeFurni(current.type, x, y, current.dir));
            },
            onFurniClick: (id) => setSelectedFurni((prev) => (prev === id ? null : id)),
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

    // Keep the scene's build mode in sync with the panel.
    useEffect(() => {
        sceneRef.current?.setBuildMode(building ? { placing, selectedId: selectedFurni } : null);
    }, [building, placing, selectedFurni, sceneRef]);

    // Stop placing an item once the last one is used.
    useEffect(() => {
        if (placing && profile && (profile.furni[placing.type] ?? 0) <= 0) setPlacing(null);
    }, [placing, profile]);

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

    const whisper = (targetId: string) => {
        const text = whisperText.trim();
        if (!text) return;
        setWhisperText('');
        run((c) => c.whisper(targetId, text));
    };

    const join = async (id: string) => {
        if (await world.enterRoom(id)) {
            setNavOpen(false);
            setRoomCode('');
        }
    };

    const saveLook = async (look: AvatarLook) => {
        const updated = await run((c) => c.setLook(look));
        if (updated) {
            world.setProfile(updated);
            setAvatarOpen(false);
        }
    };

    const buy = async (item: CatalogItem) => {
        const updated = await run((c) => c.buy(item.id));
        if (updated) {
            world.setProfile(updated);
            world.setNotice({ text: `You bought ${item.name}!`, severity: 'info' });
        }
    };

    const claimDaily = async () => {
        const updated = await run((c) => c.claimDailyBonus());
        if (updated) {
            world.setProfile(updated);
            world.setNotice({ text: '+50 coins! See you tomorrow.', severity: 'info' });
        }
    };

    const copyCode = () => {
        if (room) {
            navigator.clipboard?.writeText(room.id);
            world.setNotice({ text: `Room code ${room.id} copied.`, severity: 'info' });
        }
    };

    const stopBuilding = () => {
        setBuilding(false);
        setPlacing(null);
        setSelectedFurni(null);
    };

    // ---- panels ----

    const navigatorPanel = (
        <Box sx={{ width: 290, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', overflow: 'auto' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Navigator</Typography>
                <IconButton size="small" onClick={world.refreshRooms} aria-label="Refresh rooms">
                    <RefreshIcon fontSize="small" />
                </IconButton>
            </Stack>
            <Tabs value={world.roomTab} onChange={(_, v) => world.setRoomTab(v)} variant="fullWidth" sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, px: 1 } }}>
                <Tab value="public" label="Public" />
                <Tab value="popular" label="Popular" />
                <Tab value="mine" label="My rooms" />
            </Tabs>
            <TextField
                size="small"
                placeholder="Search rooms or owners"
                value={world.roomQuery}
                onChange={(e) => world.setRoomQuery(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <List dense disablePadding sx={{ flex: 1, overflow: 'auto', minHeight: 120 }}>
                {world.rooms.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                        {world.roomQuery
                            ? 'No rooms found.'
                            : world.roomTab === 'mine'
                                ? 'You have no rooms yet. Create one below!'
                                : world.roomTab === 'popular'
                                    ? 'No rooms have people in them right now.'
                                    : 'No rooms found.'}
                    </Typography>
                )}
                {world.rooms.map((r: RoomSummary) => (
                    <ListItemButton key={r.id} selected={room?.id === r.id} onClick={() => join(r.id)} sx={{ borderRadius: 1, mb: 0.5 }}>
                        <ListItemText
                            primary={r.name}
                            secondary={r.description || `by ${r.ownerName}`}
                            secondaryTypographyProps={{ noWrap: true }}
                        />
                        <Stack alignItems="flex-end" spacing={0.5} ml={1}>
                            <Chip size="small" label={roomKindLabel[r.kind]} color={kindColor[r.kind]} />
                            <Typography variant="caption" color={r.userCount > 0 ? 'success.light' : 'text.secondary'}>
                                👤 {r.userCount}/{r.maxUsers}
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
                    No messages yet. Say hi! 👋
                </Typography>
            )}
            {world.chat.map((m, i) => (
                <Typography
                    key={`${m.sentAt}-${i}`}
                    variant="body2"
                    sx={{ mb: 0.75, wordBreak: 'break-word', fontStyle: m.whisperTo ? 'italic' : 'normal', color: m.whisperTo ? '#d0b3ff' : 'inherit' }}
                >
                    <Box component="span" sx={{ color: 'text.secondary', fontSize: 11, mr: 1, fontStyle: 'normal' }}>
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Box>
                    <Box component="span" sx={{ fontWeight: 700, color: m.whisperTo ? '#c77dff' : occupants[m.fromId]?.isHost ? 'warning.light' : 'primary.light' }}>
                        {m.whisperTo ? `${m.name} → ${m.whisperTo} (whisper):` : `${m.name}:`}
                    </Box>{' '}
                    {m.text}
                </Typography>
            ))}
            <div ref={chatEnd} />
        </Box>
    );

    const roleOf = (p: Occupant) => (p.isHost ? 'Host' : p.isTeacher ? 'Teacher' : 'Student');

    const peopleList = (
        <List dense sx={{ flex: 1, overflow: 'auto' }}>
            {people.map((p: Occupant) => (
                <ListItemButton key={p.id} onClick={() => setSelectedId(p.id)}>
                    <ListItemText
                        primary={`${p.name}${p.id === room?.youId ? ' (you)' : ''}`}
                        secondary={[roleOf(p), p.muted ? 'muted' : '', p.dance ? 'dancing 🕺' : ''].filter(Boolean).join(' · ')}
                    />
                    {p.handRaised && <PanToolIcon fontSize="small" color="warning" />}
                </ListItemButton>
            ))}
        </List>
    );

    const hostPanel = (
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {isClassroom && <Typography variant="subtitle2">Whiteboard</Typography>}
            {isHost ? (
                <>
                    {isClassroom && (
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
                        </>
                    )}
                    <Typography variant="subtitle2">Room controls</Typography>
                    <FormControlLabel
                        control={<Switch checked={world.quietMode} onChange={(e) => run((c) => c.setQuietMode(e.target.checked))} />}
                        label="Quiet mode (only hosts can chat)"
                    />
                    <Button variant="outlined" color="warning" onClick={() => run((c) => c.clearChat())}>
                        Clear chat for everyone
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        Click someone (in the room or the People tab) to mute, kick{isOwner ? ' or ban' : ''} them.
                        {/^[A-Z0-9]{6}$/.test(room?.id ?? '') && <> Share room code <b>{room?.id}</b> so others can join.</>}
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
                {showClassTab && <Tab label={isClassroom ? 'Class' : 'Host'} />}
            </Tabs>
            {tab === 0 && chatLog}
            {tab === 1 && peopleList}
            {tab === 2 && hostPanel}
        </Paper>
    );

    const actionBar = room && (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ overflowX: 'auto', pb: 0.5 }}>
            <Tooltip title="Character">
                <IconButton onClick={() => setAvatarOpen(true)} aria-label="Customize avatar"><CheckroomIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Shop">
                <IconButton onClick={() => setShopOpen(true)} aria-label="Shop"><StorefrontIcon /></IconButton>
            </Tooltip>
            {isOwner && (
                <Tooltip title="Build mode">
                    <IconButton color={building ? 'primary' : 'default'} onClick={() => (building ? stopBuilding() : setBuilding(true))} aria-label="Build mode">
                        <ConstructionIcon />
                    </IconButton>
                </Tooltip>
            )}
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Dance">
                <IconButton color={me?.dance ? 'secondary' : 'default'} onClick={(e) => setDanceAnchor(e.currentTarget)} aria-label="Dance"><MusicNoteIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Wave">
                <IconButton onClick={() => run((c) => c.wave())} aria-label="Wave"><WavingHandIcon /></IconButton>
            </Tooltip>
            <Tooltip title={me?.sittingOnFloor ? 'Stand up' : 'Sit down'}>
                <IconButton color={me?.sittingOnFloor ? 'secondary' : 'default'} onClick={() => run((c) => c.sit(!me?.sittingOnFloor))} aria-label="Sit"><ChairIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Emojis">
                <IconButton onClick={(e) => setEmojiAnchor(e.currentTarget)} aria-label="Emojis"><EmojiEmotionsIcon /></IconButton>
            </Tooltip>
            {isClassroom && !isHost && (
                <Tooltip title={me?.handRaised ? 'Lower your hand' : 'Raise your hand'}>
                    <IconButton color={me?.handRaised ? 'warning' : 'default'} onClick={() => run((c) => c.raiseHand(!me?.handRaised))} aria-label="Raise hand">
                        <PanToolIcon />
                    </IconButton>
                </Tooltip>
            )}
            <Box flex={1} />
            {profile && (
                <Box onClick={() => setShopOpen(true)} sx={{ cursor: 'pointer' }} aria-label="Coins">
                    <Coins amount={profile.coins} />
                </Box>
            )}
        </Stack>
    );

    const buildPanel = profile && (
        <BuildPanel
            docked={wide}
            inventory={profile.furni}
            catalog={catalog}
            placing={placing}
            selectedName={selectedFurniName}
            onPick={(type) => {
                setSelectedFurni(null);
                setPlacing(type ? { type, dir: placing?.dir ?? 'se' } : null);
            }}
            onRotatePlacing={() => placing && setPlacing({ ...placing, dir: rotate(placing.dir) })}
            onRotateSelected={() => selectedFurni && run((c) => c.rotateFurni(selectedFurni))}
            onPickUpSelected={() => {
                if (selectedFurni) run((c) => c.pickUpFurni(selectedFurni));
                setSelectedFurni(null);
            }}
            onOpenShop={() => setShopOpen(true)}
            onClose={stopBuilding}
        />
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

            <Box sx={{ position: 'relative', flex: wide ? 1 : '0 0 62%', minWidth: 0, minHeight: 0 }}>
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
                    <Paper sx={{ position: 'absolute', top: 12, left: 12, right: 12, px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: overlay }}>
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
                        {isOwner && (
                            <Tooltip title="Room settings">
                                <IconButton size="small" onClick={() => setSettingsOpen(true)} aria-label="Room settings"><SettingsIcon /></IconButton>
                            </Tooltip>
                        )}
                        {status === 'reconnecting' && <Chip size="small" color="error" label="Reconnecting…" />}
                    </Paper>
                )}

                {room && (
                    <Stack spacing={1} sx={{ position: 'absolute', right: 12, top: 80 }}>
                        <IconButton sx={{ bgcolor: overlay }} onClick={() => sceneRef.current?.zoom(1.2)} aria-label="Zoom in"><ZoomInIcon /></IconButton>
                        <IconButton sx={{ bgcolor: overlay }} onClick={() => sceneRef.current?.zoom(1 / 1.2)} aria-label="Zoom out"><ZoomOutIcon /></IconButton>
                    </Stack>
                )}

                {room && building && profile && !wide && buildPanel}


                {room && (
                    <Paper sx={{ position: 'absolute', bottom: 12, left: 12, right: 12, p: 1, bgcolor: overlay }}>
                        {actionBar}
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                                size="small"
                                fullWidth
                                inputRef={chatInput}
                                placeholder={me?.muted ? 'You are muted' : world.quietMode && !isHost ? 'Quiet mode: raise your hand' : 'Say something…'}
                                value={message}
                                disabled={!canChat}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && send()}
                                inputProps={{ maxLength: 200, 'aria-label': 'Chat message' }}
                            />
                            <IconButton color="primary" onClick={send} disabled={!message.trim()} aria-label="Send"><SendIcon /></IconButton>
                        </Stack>
                    </Paper>
                )}
            </Box>

            <Box sx={{ width: wide ? 320 : '100%', flex: wide ? '0 0 320px' : 1, minHeight: 0, borderLeft: wide ? 1 : 0, borderColor: 'divider' }}>
                {room && building && wide ? buildPanel : sidePanel}
            </Box>

            <Menu anchorEl={danceAnchor} open={Boolean(danceAnchor)} onClose={() => setDanceAnchor(null)}>
                {DANCES.map((d) => (
                    <MenuItem key={d.style} selected={me?.dance === d.style} onClick={() => { run((c) => c.dance(d.style)); setDanceAnchor(null); }}>
                        🕺 {d.label}
                    </MenuItem>
                ))}
                <MenuItem disabled={!me?.dance} onClick={() => { run((c) => c.dance(0)); setDanceAnchor(null); }}>Stop dancing</MenuItem>
            </Menu>

            <Popover
                open={Boolean(emojiAnchor)}
                anchorEl={emojiAnchor}
                onClose={() => setEmojiAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Box sx={{ p: 1.5, width: 280 }}>
                    <Typography variant="caption" color="text.secondary">React (floats above your head)</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                        {EMOTES.map((e) => (
                            <IconButton key={e} size="small" disabled={!canChat} onClick={() => { run((c) => c.emote(e)); setEmojiAnchor(null); }} aria-label={`React ${e}`} sx={{ fontSize: 20 }}>
                                {e}
                            </IconButton>
                        ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary">Add to your message</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {CHAT_EMOJIS.map((e) => (
                            <IconButton key={e} size="small" disabled={!canChat} onClick={() => { setMessage((m) => (m + e).slice(0, 200)); chatInput.current?.focus(); }} aria-label={`Insert ${e}`} sx={{ fontSize: 18 }}>
                                {e}
                            </IconButton>
                        ))}
                    </Box>
                </Box>
            </Popover>

            <CreateRoomDialog
                open={createOpen}
                isTeacher={Boolean(profile?.isTeacher)}
                onClose={() => setCreateOpen(false)}
                onCreate={async (request) => {
                    const created = await run((c) => c.createRoom(request));
                    if (created) {
                        setCreateOpen(false);
                        await join(created.id);
                        world.setNotice({ text: `Room created! Room code: ${created.id}. Use 🧱 Build mode to decorate it.`, severity: 'info' });
                    }
                }}
            />

            {profile && (
                <AvatarEditor
                    open={avatarOpen}
                    profile={profile}
                    catalog={catalog}
                    onClose={() => setAvatarOpen(false)}
                    onSave={saveLook}
                    onOpenShop={() => setShopOpen(true)}
                />
            )}

            {profile && (
                <ShopDialog open={shopOpen} profile={profile} catalog={catalog} onClose={() => setShopOpen(false)} onBuy={buy} onClaimDaily={claimDaily} />
            )}

            {room && isOwner && (
                <RoomSettingsDialog
                    open={settingsOpen}
                    room={{ id: room.id, name: room.name, description: room.description, kind: room.kind, maxUsers: room.maxUsers }}
                    bans={world.bans}
                    isTeacher={Boolean(profile?.isTeacher)}
                    onClose={() => setSettingsOpen(false)}
                    onSave={async (settings) => {
                        const saved = await run((c) => c.updateRoomSettings(settings).then(() => true));
                        if (saved) {
                            setSettingsOpen(false);
                            world.setNotice({ text: 'Room settings saved.', severity: 'info' });
                            world.refreshRooms();
                        }
                    }}
                    onUnban={(userId) => run((c) => c.unban(userId))}
                    onDelete={() => {
                        setSettingsOpen(false);
                        run((c) => c.deleteRoom()).then(() => world.refreshRooms());
                    }}
                />
            )}

            <Dialog open={Boolean(selected)} onClose={() => setSelectedId(null)} maxWidth="xs" fullWidth>
                {selected && (
                    <>
                        <DialogTitle>
                            {selected.name}
                            <Typography variant="body2" color="text.secondary">
                                {roleOf(selected)}
                                {selected.muted ? ' · muted' : ''}
                                {selected.handRaised ? ' · hand raised ✋' : ''}
                            </Typography>
                        </DialogTitle>
                        {selected.id !== room?.youId && (
                            <DialogContent>
                                <Typography variant="subtitle2">Whisper</Typography>
                                <Typography variant="caption" color="text.secondary" component="div" mb={1}>
                                    Only {selected.name} and the room’s hosts can see whispers.
                                </Typography>
                                <Stack direction="row" spacing={1} mb={2}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder={canChat ? 'Psst…' : 'You can’t chat right now'}
                                        value={whisperText}
                                        disabled={!canChat}
                                        onChange={(e) => setWhisperText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && whisper(selected.id)}
                                        inputProps={{ maxLength: 200, 'aria-label': 'Whisper message' }}
                                    />
                                    <Button disabled={!whisperText.trim() || !canChat} onClick={() => whisper(selected.id)}>
                                        Send
                                    </Button>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
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
                                        Kick
                                    </Button>
                                    {isOwner && (
                                        <Button color="error" onClick={() => { run((c) => c.kick(selected.id, true)); setSelectedId(null); }}>
                                            Ban
                                        </Button>
                                    )}
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
