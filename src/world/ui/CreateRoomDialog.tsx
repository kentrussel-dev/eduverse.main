import { ReactElement, useEffect, useState } from 'react';
import {
    Box, Button, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { HabboWindow, WindowActions } from './HabboWindow';
import { CreateRoomRequest, RoomKind, RoomLayout } from '../types';

/** A little isometric picture of a room shape, like Habbo's room creation window. */
const LayoutPreview = ({ layout, size = 110 }: { layout: string[]; size?: number }) => {
    const d = layout.length;
    const w = layout[0]?.length ?? 1;
    const tw = 2;
    const th = 1;
    const wallH = 1.6;
    const pt = (x: number, y: number, z = 0) => `${(x - y) * tw},${(x + y) * th - z}`;
    const floor = (x: number, y: number) => layout[y]?.[x] !== undefined && layout[y][x] !== 'x';
    const tiles: ReactElement[] = [];
    layout.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === 'x') return;
        if (!floor(x - 1, y)) tiles.push(<polygon key={`l${x},${y}`} points={`${pt(x, y)} ${pt(x, y + 1)} ${pt(x, y + 1, wallH * 2)} ${pt(x, y, wallH * 2)}`} fill="#d98a2b" stroke="#6b3f10" strokeWidth={0.15} />);
        if (!floor(x, y - 1)) tiles.push(<polygon key={`r${x},${y}`} points={`${pt(x, y)} ${pt(x + 1, y)} ${pt(x + 1, y, wallH * 2)} ${pt(x, y, wallH * 2)}`} fill="#f0b43c" stroke="#6b3f10" strokeWidth={0.15} />);
    }));
    layout.forEach((row, y) => [...row].forEach((c, x) => {
        if (c !== 'x') tiles.push(<polygon key={`f${x},${y}`} points={`${pt(x, y)} ${pt(x + 1, y)} ${pt(x + 1, y + 1)} ${pt(x, y + 1)}`} fill="#9c6b3f" stroke="#7a5230" strokeWidth={0.08} />);
    }));
    const minX = -d * tw - 1;
    const maxX = w * tw + 1;
    const minY = -wallH * 2 - 1;
    const maxY = (w + d) * th + 1;
    return (
        <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} width={size} height={size * 0.62} aria-hidden>
            {tiles}
        </svg>
    );
};

interface Props {
    isTeacher: boolean;
    loadLayouts: () => Promise<RoomLayout[]>;
    onClose: () => void;
    onCreate: (request: CreateRoomRequest) => Promise<void>;
}

const templates: { value: CreateRoomRequest['template']; label: string }[] = [
    { value: 'apartment', label: 'Apartment (furnished: kitchen, living room, bedroom, bathroom)' },
    { value: 'house', label: 'House (big and furnished, with a games room)' },
    { value: 'classroom', label: 'Classroom (desks + whiteboard)' },
    { value: 'study_hall', label: 'Study hall (tables + bookshelves)' },
    { value: 'lounge', label: 'Lounge (sofas + plants)' },
    { value: 'empty', label: 'Small empty room' },
];

export const CreateRoomDialog = ({ isTeacher, loadLayouts, onClose, onCreate }: Props) => {
    const [layouts, setLayouts] = useState<RoomLayout[]>([]);
    useEffect(() => {
        loadLayouts().then(setLayouts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [kind, setKind] = useState<RoomKind>(isTeacher ? RoomKind.Classroom : RoomKind.Study);
    const [template, setTemplate] = useState<CreateRoomRequest['template']>(isTeacher ? 'classroom' : 'apartment');
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setBusy(true);
        try {
            await onCreate({ name: name.trim(), description: description.trim(), kind, template });
            setName('');
            setDescription('');
        } finally {
            setBusy(false);
        }
    };

    const listed = kind === RoomKind.Public || kind === RoomKind.Study;

    return (
        <HabboWindow title="Create a room" onClose={onClose} width={560} maxHeight="80vh">
            <Box>
                <Stack spacing={2} mt={1}>
                    <TextField label="Room name" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 40 }} autoFocus />
                    <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} inputProps={{ maxLength: 120 }} />
                    <TextField select label="Type" value={kind} onChange={(e) => setKind(Number(e.target.value) as RoomKind)}>
                        {isTeacher && <MenuItem value={RoomKind.Classroom}>Classroom (you're the teacher)</MenuItem>}
                        <MenuItem value={RoomKind.Study}>Study room (listed for everyone)</MenuItem>
                        <MenuItem value={RoomKind.Public}>Hangout (listed for everyone)</MenuItem>
                        <MenuItem value={RoomKind.Private}>Private (join by code only)</MenuItem>
                    </TextField>
                    <Box>
                        <Typography variant="subtitle2">Furnished rooms</Typography>
                        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={0.75} mt={0.5}>
                            {templates.map((t) => (
                                <Box key={t.value} component="button" onClick={() => setTemplate(t.value)} aria-label={`Layout ${t.label}`}
                                    sx={{ textAlign: 'left', fontSize: 12, p: 0.75, borderRadius: 1, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.3)',
                                        bgcolor: template === t.value ? '#f1f1f1' : '#8e9aa8', color: template === t.value ? '#000' : '#fff', fontWeight: 700 }}>
                                    {t.label}
                                </Box>
                            ))}
                        </Box>
                        <Typography variant="subtitle2" mt={1.5}>Empty rooms (free, build it yourself)</Typography>
                        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={0.75} mt={0.5}>
                            {layouts.map((l) => (
                                <Box key={l.id} component="button" onClick={() => setTemplate(l.id)} aria-label={`Layout ${l.name}`}
                                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0.5, borderRadius: 1, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.3)',
                                        bgcolor: template === l.id ? '#f1f1f1' : '#8e9aa8', color: template === l.id ? '#000' : '#fff' }}>
                                    <LayoutPreview layout={l.layout} />
                                    <Box sx={{ fontSize: 11.5, fontWeight: 700 }}>{l.name} · {l.tiles} tiles</Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {listed
                            ? 'Everyone can find this room in the room list.'
                            : "This room won't be listed. Share its room code so others can join."}
                    </Typography>
                </Stack>
            </Box>
            <WindowActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={submit} disabled={busy || name.trim().length < 3}>
                    Create
                </Button>
            </WindowActions>
        </HabboWindow>
    );
};
