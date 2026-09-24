import { useState } from 'react';
import {
    Box, Button, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { HabboWindow, WindowActions } from './HabboWindow';
import { CreateRoomRequest, RoomKind } from '../types';

interface Props {
    isTeacher: boolean;
    onClose: () => void;
    onCreate: (request: CreateRoomRequest) => Promise<void>;
}

const templates: { value: CreateRoomRequest['template']; label: string }[] = [
    { value: 'classroom', label: 'Classroom (desks + whiteboard)' },
    { value: 'study_hall', label: 'Study hall (tables + bookshelves)' },
    { value: 'lounge', label: 'Lounge (sofas + plants)' },
    { value: 'empty', label: 'Small empty room' },
];

export const CreateRoomDialog = ({ isTeacher, onClose, onCreate }: Props) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [kind, setKind] = useState<RoomKind>(isTeacher ? RoomKind.Classroom : RoomKind.Study);
    const [template, setTemplate] = useState<CreateRoomRequest['template']>(isTeacher ? 'classroom' : 'study_hall');
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
        <HabboWindow title="Create a room" onClose={onClose} width={380}>
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
                    <TextField select label="Layout" value={template} onChange={(e) => setTemplate(e.target.value as CreateRoomRequest['template'])}>
                        {templates.map((t) => (
                            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                        ))}
                    </TextField>
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
