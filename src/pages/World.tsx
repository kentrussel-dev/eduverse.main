import { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Badge, Box, Button, ButtonBase, Divider, FormControlLabel, IconButton, InputAdornment, List, ListItemButton,
    ListItemText, Menu, MenuItem, Popover, Stack, Switch, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ExploreIcon from '@mui/icons-material/Explore';
import HomeIcon from '@mui/icons-material/Home';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoomScene } from '../world/RoomScene';
import { avatarThumbnail } from '../world/thumbnails';
import { useWorld } from '../world/useWorld';
import { AvatarEditor } from '../world/ui/AvatarEditor';
import { BuildPanel } from '../world/ui/BuildPanel';
import { CreateRoomDialog } from '../world/ui/CreateRoomDialog';
import { HabboWindow } from '../world/ui/HabboWindow';
import { habbo, habboTheme } from '../world/ui/habboTheme';
import { RoomSettingsDialog } from '../world/ui/RoomSettingsDialog';
import { Coins, ShopDialog } from '../world/ui/ShopDialog';
import { loadFurniAssets } from '../world/furniAssets';
import { BoardPanel } from '../world/ui/BoardPanel';
import { ConfirmWindow } from '../world/ui/ConfirmWindow';
import DrawIcon from '@mui/icons-material/Draw';
import {
    AvatarLook, CatalogItem, DANCES, Dir, EMOTES, Occupant, RoomKind, roomKindLabel, RoomSummary,
} from '../world/types';

const TOOLBAR_HEIGHT = 56;
/** On phones the chat box gets its own row above the toolbar. */
const PHONE_CHAT_HEIGHT = 46;
const CHAT_EMOJIS = ['😀', '😂', '😊', '😍', '😎', '🤩', '😢', '😡', '👍', '👋', '🙏', '💯', '🔥', '🎉', '📚', '✏️', '🧠', '⚽', '🎮', '🍕'];
const ROTATION: Dir[] = ['se', 'sw', 'nw', 'ne'];
const rotate = (dir: Dir) => ROTATION[(ROTATION.indexOf(dir) + 1) % ROTATION.length];

type WindowName = 'navigator' | 'shop' | 'inventory' | 'character' | 'chatlog' | 'people' | 'class' | 'settings' | 'create';

/** A picture of an avatar, rendered once and cached. */
const AvatarImage = ({ look, height }: { look: AvatarLook; height: number }) => {
    const [src, setSrc] = useState('');
    const key = JSON.stringify(look);
    useEffect(() => {
        let alive = true;
        avatarThumbnail(JSON.parse(key)).then((url) => alive && setSrc(url));
        return () => {
            alive = false;
        };
    }, [key]);
    return src ? <img src={src} alt="" style={{ height, display: 'block', imageRendering: 'pixelated' }} /> : <Box sx={{ height }} />;
};

/** An icon button on the bottom toolbar. */
const ToolbarButton = ({ label, onClick, active, children, badge }: {
    label: string; onClick: () => void; active?: boolean; children: ReactNode; badge?: number;
}) => (
    <Tooltip title={label}>
        <ButtonBase
            aria-label={label}
            onClick={onClick}
            sx={{
                width: 42, height: 42, borderRadius: '6px', flexShrink: 0,
                bgcolor: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
        >
            <Badge badgeContent={badge} color="error" overlap="circular">{children}</Badge>
        </ButtonBase>
    </Tooltip>
);

/** A dark button used in the infostand, like the Habbo client's. */
const StandButton = ({ children, onClick, danger }: { children: ReactNode; onClick: (e: MouseEvent<HTMLElement>) => void; danger?: boolean }) => (
    <ButtonBase
        onClick={onClick}
        sx={{
            px: 1.25, height: 26, borderRadius: '6px', fontSize: 12, fontWeight: 700, color: '#fff',
            bgcolor: danger ? habbo.red : '#3b3b52', border: '1px solid #000',
            '&:hover': { bgcolor: danger ? habbo.redDark : '#4b4b66' },
        }}
    >
        {children}
    </ButtonBase>
);

const WorldClient = () => {
    const world = useWorld();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { room, occupants, profile, status, run, sceneRef, catalog, clientRef } = world;
    // The drawing board docked on the right half of the screen.
    const [boardOpen, setBoardOpen] = useState(false);
    const [confirmPickUpAll, setConfirmPickUpAll] = useState(false);
    const hasBoard = Boolean(room?.furni.some((f) => f.type === 'whiteboard'));
    // The room gets narrower when the board opens; tell Pixi so it resizes and re-centres.
    useEffect(() => {
        const id = window.requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
        return () => window.cancelAnimationFrame(id);
    }, [boardOpen]);
    const phone = useMediaQuery('(max-width:600px)');
    const canvasHost = useRef<HTMLDivElement>(null);
    const chatInput = useRef<HTMLInputElement>(null);

    // The dashboard's "Change clothes" link opens the character editor (/world?open=character).
    const [windows, setWindows] = useState<Set<WindowName>>(() =>
        new URLSearchParams(window.location.search).get('open') === 'character' ? new Set<WindowName>(['character']) : new Set());
    const [message, setMessage] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [standMode, setStandMode] = useState<'none' | 'whisper' | 'report'>('none');
    const [standText, setStandText] = useState('');
    const [boardDraft, setBoardDraft] = useState('');
    const [danceAnchor, setDanceAnchor] = useState<HTMLElement | null>(null);
    const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
    const [placing, setPlacing] = useState<{ type: string; dir: Dir } | null>(null);
    const [selectedFurni, setSelectedFurni] = useState<string | null>(null);

    const isOpen = (name: WindowName) => windows.has(name);
    const bottomSpace = phone ? TOOLBAR_HEIGHT + PHONE_CHAT_HEIGHT : TOOLBAR_HEIGHT;
    const toggle = useCallback((name: WindowName, open?: boolean) =>
        setWindows((prev) => {
            const next = new Set(prev);
            const shouldOpen = open ?? !next.has(name);
            if (shouldOpen) next.add(name);
            else next.delete(name);
            return next;
        }), []);

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
    const canChat = !me?.muted && !(world.quietMode && !isHost);
    const building = isOpen('inventory') && isOwner;
    const selectedFurniType = selectedFurni ? sceneRef.current?.furniItem(selectedFurni)?.type : undefined;
    const selectedFurniName = selectedFurniType ? catalog.find((i) => i.id === selectedFurniType)?.name ?? selectedFurniType : null;

    // The scene calls back into React; keep the latest placing state where its callbacks can read it.
    const placingRef = useRef(placing);
    placingRef.current = placing;

    // The furniture list must be loaded before a room is drawn.
    const [furniReady, setFurniReady] = useState(false);
    useEffect(() => {
        loadFurniAssets().then(() => setFurniReady(true));
    }, []);

    // Build a fresh PixiJS scene whenever we enter a room.
    useEffect(() => {
        if (!room || !canvasHost.current || !furniReady) return undefined;
        setPlacing(null);
        setSelectedFurni(null);
        setSelectedId(null);
        setBoardOpen(false);
        const scene = new RoomScene(canvasHost.current, room, {
            onWhiteboardClick: () => setBoardOpen(true),
            onTileClick: (x, y) => {
                run((c) => c.move(x, y));
            },
            onAvatarClick: (id) => {
                setSelectedId(id);
                setStandMode('none');
                setStandText('');
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
    }, [room?.id, room?.youId, furniReady]);

    // Keep the scene's build mode in sync with the inventory window.
    useEffect(() => {
        sceneRef.current?.setBuildMode(building ? { placing, selectedId: selectedFurni } : null);
    }, [building, placing, selectedFurni, sceneRef]);

    // Stop placing an item once the last one is used.
    useEffect(() => {
        if (placing && profile && (profile.furni[placing.type] ?? 0) <= 0) setPlacing(null);
    }, [placing, profile]);

    // Close the infostand when that person leaves.
    useEffect(() => {
        if (selectedId && !occupants[selectedId]) setSelectedId(null);
    }, [selectedId, occupants]);

    // Close owner-only windows when we're no longer the owner (e.g. after changing rooms).
    useEffect(() => {
        if (!isOwner) toggle('settings', false);
    }, [isOwner, toggle]);

    const chatEnd = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEnd.current?.scrollIntoView({ block: 'end' });
    }, [world.chat, windows]);

    const send = async () => {
        const text = message.trim();
        if (!text) return;
        setMessage('');
        await run((c) => c.say(text));
    };

    const join = async (id: string) => {
        if (await world.enterRoom(id)) {
            setRoomCode('');
            if (phone) toggle('navigator', false);
        }
    };

    const saveLook = async (look: AvatarLook) => {
        const updated = await run((c) => c.setLook(look));
        if (updated) {
            world.setProfile(updated);
            toggle('character', false);
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

    const signOut = async () => {
        try {
            await logout();
        } catch {
            // Signing out locally is enough even if the server call fails.
        }
        navigate('/login');
    };

    const roleOf = (p: Occupant) => (p.isHost ? (p.id === room?.youId && isOwner ? 'Room owner' : 'Host') : p.isTeacher ? 'Teacher' : 'Student');
    const isCode = (id: string) => /^[A-Z0-9]{6}$/.test(id);

    // Notices disappear on their own.
    useEffect(() => {
        if (!world.notice) return undefined;
        const timer = window.setTimeout(() => world.setNotice(null), 5000);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [world.notice]);

    // ---- windows ----

    const navigatorWindow = isOpen('navigator') && (
        <HabboWindow title="Navigator" onClose={() => toggle('navigator', false)} width={400} initial={{ x: 16, y: 16 }}>
            <Tabs value={world.roomTab} onChange={(_, v) => world.setRoomTab(v)}>
                <Tab value="public" label="Public rooms" />
                <Tab value="popular" label="Popular" />
                <Tab value="mine" label="My rooms" />
            </Tabs>
            <Stack direction="row" spacing={1} mt={1}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search rooms or owners"
                    value={world.roomQuery}
                    onChange={(e) => world.setRoomQuery(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
                <IconButton size="small" onClick={world.refreshRooms} aria-label="Refresh rooms"><RefreshIcon fontSize="small" /></IconButton>
            </Stack>
            <List dense disablePadding sx={{ mt: 1, bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.3)', borderRadius: 1, maxHeight: 280, overflow: 'auto' }}>
                {world.rooms.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
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
                    <ListItemButton key={r.id} selected={room?.id === r.id} onClick={() => join(r.id)} sx={{ py: 0.25 }}>
                        <Box
                            sx={{
                                minWidth: 34, height: 20, mr: 1, borderRadius: '4px', fontSize: 11, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.4)',
                                bgcolor: r.userCount === 0 ? '#c6c6c6' : r.userCount < r.maxUsers / 2 ? '#62c462' : '#ffbf00',
                            }}
                        >
                            {r.userCount}
                        </Box>
                        <ListItemText
                            primary={r.name}
                            secondary={`${roomKindLabel[r.kind]} · ${r.description || `by ${r.ownerName}`}`}
                            primaryTypographyProps={{ fontWeight: 700, fontSize: 13, noWrap: true }}
                            secondaryTypographyProps={{ noWrap: true, fontSize: 11 }}
                        />
                    </ListItemButton>
                ))}
            </List>
            <Stack direction="row" spacing={1} mt={1.5} alignItems="center">
                <TextField
                    size="small"
                    placeholder="Room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && roomCode.trim() && join(roomCode.trim())}
                    inputProps={{ maxLength: 20, 'aria-label': 'Room code' }}
                    sx={{ width: 120 }}
                />
                <Button disabled={!roomCode.trim()} onClick={() => join(roomCode.trim())}>Go</Button>
                <Box flex={1} />
                <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => toggle('create', true)}>
                    {profile?.isTeacher ? 'Create room / class' : 'Create room'}
                </Button>
            </Stack>
        </HabboWindow>
    );

    const chatlogWindow = isOpen('chatlog') && (
        <HabboWindow title="Chat history" onClose={() => toggle('chatlog', false)} width={340} initial={{ x: window.innerWidth - 410, y: 16 }}>
            <Box sx={{ bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.3)', borderRadius: 1, p: 1, height: 300, overflow: 'auto' }}>
                {world.chat.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>No messages yet.</Typography>
                )}
                {world.chat.map((m, i) => (
                    <Typography
                        key={`${m.sentAt}-${i}`}
                        variant="body2"
                        sx={{ mb: 0.5, wordBreak: 'break-word', fontStyle: m.whisperTo ? 'italic' : 'normal', color: m.whisperTo ? '#5a189a' : '#000' }}
                    >
                        <Box component="span" sx={{ color: '#777', fontSize: 11, mr: 0.75, fontStyle: 'normal' }}>
                            {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Box>
                        <b>{m.whisperTo ? `${m.name} → ${m.whisperTo}:` : `${m.name}:`}</b> {m.text}
                    </Typography>
                ))}
                <div ref={chatEnd} />
            </Box>
        </HabboWindow>
    );

    const peopleWindow = isOpen('people') && (
        <HabboWindow title={`People in room (${people.length})`} onClose={() => toggle('people', false)} width={280} initial={{ x: window.innerWidth - 350, y: 360 }}>
            <List dense disablePadding sx={{ bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.3)', borderRadius: 1, maxHeight: 260, overflow: 'auto' }}>
                {people.map((p) => (
                    <ListItemButton key={p.id} onClick={() => setSelectedId(p.id)} selected={selectedId === p.id} sx={{ py: 0.25 }}>
                        <ListItemText
                            primary={`${p.name}${p.id === room?.youId ? ' (you)' : ''}`}
                            secondary={[roleOf(p), p.muted ? 'muted' : '', p.dance ? 'dancing' : ''].filter(Boolean).join(' · ')}
                            primaryTypographyProps={{ fontWeight: 700, fontSize: 13 }}
                            secondaryTypographyProps={{ fontSize: 11 }}
                        />
                        {p.handRaised && <span aria-label="hand raised">✋</span>}
                    </ListItemButton>
                ))}
            </List>
        </HabboWindow>
    );

    const classWindow = isOpen('class') && room && (
        <HabboWindow title={isClassroom ? 'Classroom' : 'Room tools'} onClose={() => toggle('class', false)} width={340}>
            {isClassroom && (
                <>
                    <Typography variant="subtitle2" fontWeight={700}>Whiteboard</Typography>
                    {isHost ? (
                        <Stack spacing={1} mt={0.5}>
                            <TextField
                                multiline
                                minRows={4}
                                maxRows={10}
                                value={boardDraft}
                                onChange={(e) => setBoardDraft(e.target.value)}
                                placeholder="Today's lesson, homework, or a question for the class"
                                inputProps={{ maxLength: 2000 }}
                            />
                            <Button variant="contained" onClick={() => run((c) => c.setWhiteboard(boardDraft))}>Update whiteboard</Button>
                        </Stack>
                    ) : (
                        <Box sx={{ mt: 0.5, p: 1, whiteSpace: 'pre-wrap', bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.3)', borderRadius: 1, minHeight: 100 }}>
                            {world.whiteboard || 'The teacher hasn’t written anything yet.'}
                        </Box>
                    )}
                </>
            )}
            {isHost && (
                <>
                    {isClassroom && <Divider sx={{ my: 1.5 }} />}
                    <FormControlLabel
                        control={<Switch checked={world.quietMode} onChange={(e) => run((c) => c.setQuietMode(e.target.checked))} />}
                        label="Quiet mode (only hosts can chat)"
                    />
                    <Stack direction="row" spacing={1} mt={1}>
                        <Button color="error" onClick={() => run((c) => c.clearChat())}>Clear chat for everyone</Button>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                        {raisedHands > 0 ? `✋ ${raisedHands} hand${raisedHands > 1 ? 's' : ''} raised. ` : ''}
                        Click someone to mute, kick{isOwner ? ' or ban' : ''} them.
                    </Typography>
                </>
            )}
        </HabboWindow>
    );

    const inventoryWindow = isOpen('inventory') && profile && (
        <BuildPanel
            canBuild={isOwner}
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
            onOpenShop={() => toggle('shop', true)}
            wallpaper={room?.wallpaper ?? 'default'}
            floor={room?.floor ?? 'default'}
            onStyle={(w, f) => run((c) => c.setRoomStyle(w, f))}
            onPickUpAll={() => {
                setConfirmPickUpAll(true);
                setSelectedFurni(null);
            }}
            onClose={() => {
                toggle('inventory', false);
                setPlacing(null);
                setSelectedFurni(null);
            }}
        />
    );

    // The infostand: details and actions for whoever was clicked, bottom-right like Habbo.
    const infostand = selected && room && (
        <Box
            sx={{
                position: 'fixed', right: 8, bottom: bottomSpace + 8, zIndex: 1250, width: phone ? 'calc(100% - 16px)' : 230,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75,
            }}
        >
            <Box sx={{ width: '100%', bgcolor: habbo.card, color: '#fff', border: '1px solid #000', borderRadius: '8px', p: 1.25, position: 'relative' }}>
                <Box
                    component="button"
                    aria-label="Close infostand"
                    onClick={() => setSelectedId(null)}
                    sx={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, p: 0, border: '2px solid #fff', borderRadius: '4px', bgcolor: habbo.red, color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}
                >
                    ✕
                </Box>
                <Typography fontWeight={700} fontSize={14} pr={3}>{selected.name}</Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 0.75 }} />
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 64, display: 'flex', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                        <AvatarImage look={selected.look} height={110} />
                    </Box>
                    <Box sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                        <div>{roleOf(selected)}</div>
                        {selected.muted && <div>🔇 Muted</div>}
                        {selected.handRaised && <div>✋ Hand raised</div>}
                        {selected.dance > 0 && <div>🕺 Dancing</div>}
                        {selected.sittingOnFloor && <div>Sitting</div>}
                    </Box>
                </Stack>
                {standMode !== 'none' && (
                    <Box mt={1}>
                        <TextField
                            size="small"
                            fullWidth
                            autoFocus
                            placeholder={standMode === 'whisper' ? 'Psst… (the room’s hosts can see whispers)' : 'What happened? (optional)'}
                            value={standText}
                            disabled={standMode === 'whisper' && !canChat}
                            onChange={(e) => setStandText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key !== 'Enter') return;
                                if (standMode === 'whisper' && standText.trim()) {
                                    run((c) => c.whisper(selected.id, standText.trim()));
                                    setStandText('');
                                } else if (standMode === 'report') {
                                    run((c) => c.report(selected.id, standText));
                                    setStandMode('none');
                                    setStandText('');
                                }
                            }}
                            inputProps={{ maxLength: standMode === 'whisper' ? 200 : 300, 'aria-label': standMode === 'whisper' ? 'Whisper message' : 'Report reason' }}
                        />
                        {standMode === 'report' && (
                            <Stack direction="row" spacing={1} mt={0.75}>
                                <StandButton danger onClick={() => { run((c) => c.report(selected.id, standText)); setStandMode('none'); setStandText(''); }}>
                                    Send report
                                </StandButton>
                            </Stack>
                        )}
                    </Box>
                )}
            </Box>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
                {selected.id === room.youId ? (
                    <>
                        <StandButton onClick={() => toggle('character', true)}>Change looks</StandButton>
                        <StandButton onClick={() => run((c) => c.wave())}>Wave</StandButton>
                        <StandButton onClick={() => run((c) => c.sit(!me?.sittingOnFloor))}>{me?.sittingOnFloor ? 'Stand' : 'Sit'}</StandButton>
                        <StandButton onClick={(e) => setDanceAnchor(e.currentTarget)}>{me?.dance ? 'Dancing ▾' : 'Dance ▾'}</StandButton>
                        {isClassroom && !isHost && (
                            <StandButton onClick={() => run((c) => c.raiseHand(!me?.handRaised))}>{me?.handRaised ? 'Lower hand' : 'Raise hand'}</StandButton>
                        )}
                    </>
                ) : (
                    <>
                        <StandButton onClick={() => { setStandMode(standMode === 'whisper' ? 'none' : 'whisper'); setStandText(''); }}>Whisper</StandButton>
                        {isHost && !selected.isHost && (
                            <>
                                <StandButton onClick={() => run((c) => c.mute(selected.id, !selected.muted))}>{selected.muted ? 'Unmute' : 'Mute'}</StandButton>
                                <StandButton onClick={() => run((c) => c.kick(selected.id))}>Kick</StandButton>
                                {isOwner && <StandButton danger onClick={() => run((c) => c.kick(selected.id, true))}>Ban</StandButton>}
                            </>
                        )}
                        <StandButton danger onClick={() => { setStandMode(standMode === 'report' ? 'none' : 'report'); setStandText(''); }}>Report</StandButton>
                    </>
                )}
            </Stack>
        </Box>
    );

    const chatBox = (
        <Box
            sx={{
                width: '100%', maxWidth: 480, height: 32, display: 'flex', alignItems: 'center', bgcolor: canChat ? '#fff' : '#bbb',
                border: '2px solid #000', borderRadius: '8px', px: 0.5,
            }}
        >
            <Box
                component="input"
                ref={chatInput}
                aria-label="Chat message"
                value={message}
                disabled={!room || !canChat}
                maxLength={200}
                placeholder={!room ? '' : me?.muted ? 'You are muted' : world.quietMode && !isHost ? 'Quiet mode: raise your hand' : 'Click here to chat…'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && send()}
                sx={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', bgcolor: 'transparent', fontFamily: 'inherit', fontSize: 13, px: 0.5 }}
            />
            <IconButton size="small" disabled={!room || !canChat} onClick={(e) => setEmojiAnchor(e.currentTarget)} aria-label="Emojis" sx={{ p: 0.25 }}>
                <EmojiEmotionsIcon fontSize="small" />
            </IconButton>
        </Box>
    );

    // ---- screens ----

    if (status === 'connecting' && !room) {
        return (
            <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: '#fff' }}>
                <Typography fontWeight={700} fontSize={20}>EduVerse</Typography>
                <Box sx={{ width: 240, height: 14, border: '2px solid #fff', borderRadius: '4px', p: '2px' }}>
                    <Box sx={{ width: '70%', height: '100%', bgcolor: '#fff', borderRadius: '2px' }} />
                </Box>
                <Typography fontSize={12} color="rgba(255,255,255,0.7)">Arriving on campus…</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#000', overflow: 'hidden', fontFamily: habboTheme.typography.fontFamily }}>
            <Box ref={canvasHost} sx={{ position: 'absolute', left: 0, right: boardOpen ? { xs: 0, md: '50%' } : 0, top: 0, bottom: bottomSpace, touchAction: 'none' }} />
            {confirmPickUpAll && (
                <ConfirmWindow
                    title="Pick up all"
                    message="Pick up all the furniture in this room? It goes back to your inventory."
                    confirmLabel="Pick up all"
                    onCancel={() => setConfirmPickUpAll(false)}
                    onConfirm={() => {
                        setConfirmPickUpAll(false);
                        run((c) => c.pickUpAll());
                    }}
                />
            )}
            {boardOpen && room && clientRef.current && (
                <Box sx={{ position: 'absolute', top: 0, right: 0, left: 0, bottom: bottomSpace, pointerEvents: 'none', '& > *': { pointerEvents: 'auto' } }}>
                    <BoardPanel client={clientRef.current} youId={room.youId} isHost={isHost} occupants={Object.values(occupants)} onClose={() => setBoardOpen(false)} />
                </Box>
            )}

            {/* Campus view when not in a room */}
            {!room && (
                <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: bottomSpace, bgcolor: '#6aa6c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ bgcolor: habbo.window, border: `1px solid ${habbo.border}`, borderRadius: '8px', overflow: 'hidden', width: 320 }}>
                        <Box sx={{ bgcolor: habbo.blue, color: '#fff', fontWeight: 700, textAlign: 'center', py: 0.75 }}>EduVerse</Box>
                        <Stack spacing={1.5} p={2} alignItems="center">
                            <Typography>{status === 'disconnected' ? 'You were disconnected from the campus.' : 'You are not in a room.'}</Typography>
                            {status === 'disconnected' ? (
                                <Stack direction="row" spacing={1}>
                                    <Button variant="contained" onClick={() => window.location.reload()}>Reconnect</Button>
                                    <Button onClick={signOut}>Sign out</Button>
                                </Stack>
                            ) : (
                                <Stack direction="row" spacing={1}>
                                    <Button variant="contained" color="secondary" onClick={() => join('lobby')}>Go to Main Hall</Button>
                                    <Button onClick={() => toggle('navigator', true)}>Navigator</Button>
                                </Stack>
                            )}
                        </Stack>
                    </Box>
                </Box>
            )}

            {/* Room info, top-left */}
            {room && (
                <Box sx={{ position: 'absolute', top: 8, left: 8, maxWidth: 'calc(100% - 70px)', bgcolor: 'rgba(28,28,32,0.92)', color: '#fff', border: '1px solid #000', borderRadius: '8px', px: 1.25, py: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} fontSize={14} noWrap>{room.name}</Typography>
                        <Typography fontSize={11} color="rgba(255,255,255,0.7)" noWrap>
                            {roomKindLabel[room.kind]} by {room.ownerName}
                            {world.quietMode ? ' · Quiet mode' : ''}
                            {status === 'reconnecting' ? ' · Reconnecting…' : ''}
                        </Typography>
                    </Box>
                    {isCode(room.id) && (
                        <Tooltip title="Copy room code">
                            <ButtonBase onClick={copyCode} sx={{ px: 0.75, height: 22, borderRadius: '4px', bgcolor: '#3b3b52', border: '1px solid #000', color: '#fff', fontSize: 11, fontWeight: 700, gap: 0.5 }}>
                                <ContentCopyIcon sx={{ fontSize: 12 }} />{room.id}
                            </ButtonBase>
                        </Tooltip>
                    )}
                    {isOwner && (
                        <IconButton size="small" onClick={() => toggle('settings')} aria-label="Room settings" sx={{ color: '#fff' }}>
                            <SettingsIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            )}

            {room && (
                <Stack spacing={0.5} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    {[
                        { label: 'Zoom in', icon: <ZoomInIcon fontSize="small" />, factor: 1.2 },
                        { label: 'Zoom out', icon: <ZoomOutIcon fontSize="small" />, factor: 1 / 1.2 },
                    ].map((z) => (
                        <IconButton key={z.label} aria-label={z.label} onClick={() => sceneRef.current?.zoom(z.factor)}
                            sx={{ bgcolor: 'rgba(28,28,32,0.92)', color: '#fff', border: '1px solid #000', borderRadius: '6px', '&:hover': { bgcolor: '#3b3b52' } }}>
                            {z.icon}
                        </IconButton>
                    ))}
                </Stack>
            )}

            {navigatorWindow}
            {chatlogWindow}
            {peopleWindow}
            {classWindow}
            {inventoryWindow}
            {infostand}

            {isOpen('create') && (
                <CreateRoomDialog
                    loadLayouts={() => run((c) => c.getLayouts()).then((l) => l ?? [])}
                    isTeacher={Boolean(profile?.isTeacher)}
                    onClose={() => toggle('create', false)}
                    onCreate={async (request) => {
                        const created = await run((c) => c.createRoom(request));
                        if (created) {
                            toggle('create', false);
                            await join(created.id);
                            world.setNotice({ text: `Room created! Code: ${created.id}. Open your Inventory to decorate it.`, severity: 'info' });
                        }
                    }}
                />
            )}

            {isOpen('character') && profile && (
                <AvatarEditor
                    profile={profile}
                    catalog={catalog}
                    onClose={() => toggle('character', false)}
                    onSave={saveLook}
                    onOpenShop={() => toggle('shop', true)}
                />
            )}

            {isOpen('shop') && profile && (
                <ShopDialog profile={profile} catalog={catalog} onClose={() => toggle('shop', false)} onBuy={buy} onClaimDaily={claimDaily} />
            )}

            {isOpen('settings') && room && isOwner && (
                <RoomSettingsDialog
                    room={{ id: room.id, name: room.name, description: room.description, kind: room.kind, maxUsers: room.maxUsers }}
                    bans={world.bans}
                    isTeacher={Boolean(profile?.isTeacher)}
                    onClose={() => toggle('settings', false)}
                    onSave={async (settings) => {
                        const saved = await run((c) => c.updateRoomSettings(settings).then(() => true));
                        if (saved) {
                            toggle('settings', false);
                            world.setNotice({ text: 'Room settings saved.', severity: 'info' });
                            world.refreshRooms();
                        }
                    }}
                    onUnban={(userId) => run((c) => c.unban(userId))}
                    onDelete={() => {
                        toggle('settings', false);
                        run((c) => c.deleteRoom()).then(() => world.refreshRooms());
                    }}
                />
            )}

            {phone && (
                <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: TOOLBAR_HEIGHT, height: PHONE_CHAT_HEIGHT, bgcolor: habbo.toolbar, borderTop: `1px solid ${habbo.toolbarBorder}`, display: 'flex', alignItems: 'center', px: 1 }}>
                    {chatBox}
                </Box>
            )}

            {/* Bottom toolbar */}
            <Box
                sx={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, height: TOOLBAR_HEIGHT, bgcolor: habbo.toolbar,
                    borderTop: `1px solid ${habbo.toolbarBorder}`, display: 'flex', alignItems: 'center', gap: 0.5, px: 1,
                    overflowX: 'auto', overflowY: 'hidden',
                }}
            >
                <ToolbarButton label="Main Hall" onClick={() => join('lobby')}><HomeIcon sx={{ color: '#f4a261' }} /></ToolbarButton>
                <ToolbarButton label="Navigator" active={isOpen('navigator')} onClick={() => toggle('navigator')}><ExploreIcon sx={{ color: '#4cc9f0' }} /></ToolbarButton>
                <ToolbarButton label="Shop" active={isOpen('shop')} onClick={() => toggle('shop')}><StorefrontIcon sx={{ color: '#62c462' }} /></ToolbarButton>
                <ToolbarButton label="Inventory" active={isOpen('inventory')} onClick={() => toggle('inventory')}><Inventory2Icon sx={{ color: '#e9c46a' }} /></ToolbarButton>
                {profile && (
                    <Tooltip title="Me">
                        <ButtonBase
                            aria-label="Me"
                            onClick={() => (room ? setSelectedId(room.youId) : toggle('character', true))}
                            sx={{ width: 42, height: 42, borderRadius: '6px', overflow: 'hidden', flexShrink: 0, alignItems: 'flex-start', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            <Box sx={{ mt: '-2px' }}><AvatarImage look={profile.look} height={84} /></Box>
                        </ButtonBase>
                    </Tooltip>
                )}

                {phone ? <Box flex={1} /> : <Box sx={{ flex: 1, minWidth: 200, display: 'flex', justifyContent: 'center', mx: 1 }}>{chatBox}</Box>}

                {room && hasBoard && (
                    <ToolbarButton label="Board" active={boardOpen} onClick={() => setBoardOpen(!boardOpen)}>
                        <DrawIcon sx={{ color: '#fff' }} />
                    </ToolbarButton>
                )}
                {room && (isClassroom || isHost) && (
                    <ToolbarButton label={isClassroom ? 'Classroom' : 'Room tools'} active={isOpen('class')} onClick={() => toggle('class')} badge={isHost ? raisedHands : undefined}>
                        <SchoolIcon sx={{ color: '#ffd166' }} />
                    </ToolbarButton>
                )}
                <ToolbarButton label="Chat history" active={isOpen('chatlog')} onClick={() => toggle('chatlog')}><ChatIcon sx={{ color: '#fff' }} /></ToolbarButton>
                <ToolbarButton label="People" active={isOpen('people')} onClick={() => toggle('people')} badge={people.length || undefined}>
                    <PeopleIcon sx={{ color: '#fff' }} />
                </ToolbarButton>
                {profile && (
                    <ButtonBase onClick={() => toggle('shop', true)} aria-label="Coins" sx={{ ml: 0.5, flexShrink: 0 }}>
                        <Coins amount={profile.coins} />
                    </ButtonBase>
                )}
                <ToolbarButton label="Sign out" onClick={signOut}><LogoutIcon sx={{ color: '#ff8a80' }} /></ToolbarButton>
            </Box>

            <Menu anchorEl={danceAnchor} open={Boolean(danceAnchor)} onClose={() => setDanceAnchor(null)}>
                {DANCES.map((d) => (
                    <MenuItem key={d.style} selected={me?.dance === d.style} onClick={() => { run((c) => c.dance(d.style)); setDanceAnchor(null); }}>
                        {d.label}
                    </MenuItem>
                ))}
                <MenuItem disabled={!me?.dance} onClick={() => { run((c) => c.dance(0)); setDanceAnchor(null); }}>Stop dancing</MenuItem>
            </Menu>

            <Popover
                open={Boolean(emojiAnchor)}
                anchorEl={emojiAnchor}
                onClose={() => setEmojiAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Box sx={{ p: 1, width: 272, bgcolor: habbo.window }}>
                    <Typography variant="caption" fontWeight={700}>Reactions</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.25} mb={0.75}>
                        {EMOTES.map((e) => (
                            <IconButton key={e} size="small" onClick={() => { run((c) => c.emote(e)); setEmojiAnchor(null); }} aria-label={`React ${e}`} sx={{ fontSize: 18 }}>
                                {e}
                            </IconButton>
                        ))}
                    </Box>
                    <Typography variant="caption" fontWeight={700}>Add to message</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.25}>
                        {CHAT_EMOJIS.map((e) => (
                            <IconButton key={e} size="small" onClick={() => { setMessage((m) => (m + e).slice(0, 200)); chatInput.current?.focus(); }} aria-label={`Insert ${e}`} sx={{ fontSize: 16 }}>
                                {e}
                            </IconButton>
                        ))}
                    </Box>
                </Box>
            </Popover>

            {/* Notification bubble, bottom-left above the toolbar */}
            {world.notice && (
                <Box
                    role="status"
                    onClick={() => world.setNotice(null)}
                    sx={{
                        position: 'fixed', left: 8, bottom: bottomSpace + 8, zIndex: 1400, maxWidth: 320, cursor: 'pointer',
                        bgcolor: world.notice.severity === 'error' ? habbo.red : habbo.card, color: '#fff',
                        border: '1px solid #000', borderRadius: '8px', px: 1.5, py: 1, fontSize: 13,
                    }}
                >
                    {world.notice.text}
                </Box>
            )}
        </Box>
    );
};

/** The world, styled like the Habbo client. */
export const World = () => (
    <ThemeProvider theme={habboTheme}>
        <WorldClient />
    </ThemeProvider>
);
