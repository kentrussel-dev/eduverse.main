import { useState } from 'react';
import {
    Box, Button, Divider, List, ListItem, ListItemText, MenuItem, Stack,
    TextField, Typography,
} from '@mui/material';
import { HabboWindow, WindowActions } from './HabboWindow';
import { RoomBan, RoomKind, RoomSettings } from '../types';

interface Props {
    room: RoomSettings & { id: string };
    bans: RoomBan[];
    isTeacher: boolean;
    onClose: () => void;
    onSave: (settings: RoomSettings) => Promise<void>;
    onUnban: (userId: string) => void;
    onDelete: () => void;
}

export const RoomSettingsDialog = ({ room, bans, isTeacher, onClose, onSave, onUnban, onDelete }: Props) => {
    const [draft, setDraft] = useState<RoomSettings>(room);
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <HabboWindow title="Room settings" onClose={onClose} width={380}>
            <Box>
                <Stack spacing={2} mt={1}>
                    <TextField label="Room name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} inputProps={{ maxLength: 40 }} />
                    <TextField label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} inputProps={{ maxLength: 120 }} />
                    <TextField select label="Who can find it" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: Number(e.target.value) as RoomKind })}>
                        {(isTeacher || room.kind === RoomKind.Classroom) && <MenuItem value={RoomKind.Classroom}>Classroom (join by code)</MenuItem>}
                        <MenuItem value={RoomKind.Public}>Hangout (listed for everyone)</MenuItem>
                        <MenuItem value={RoomKind.Study}>Study room (listed for everyone)</MenuItem>
                        <MenuItem value={RoomKind.Private}>Private (join by code: {room.id})</MenuItem>
                    </TextField>
                    <TextField
                        type="number"
                        label="Max visitors"
                        value={draft.maxUsers}
                        onChange={(e) => setDraft({ ...draft, maxUsers: Number(e.target.value) })}
                        inputProps={{ min: 2, max: 50 }}
                    />
                </Stack>

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2">Banned</Typography>
                {bans.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Nobody is banned.</Typography>
                ) : (
                    <List dense>
                        {bans.map((ban) => (
                            <ListItem key={ban.userId} secondaryAction={<Button size="small" onClick={() => onUnban(ban.userId)}>Unban</Button>}>
                                <ListItemText primary={ban.name} />
                            </ListItem>
                        ))}
                    </List>
                )}

                <Divider sx={{ my: 2 }} />
                {confirmDelete ? (
                    <Stack spacing={1}>
                        <Typography variant="body2" color="error.main">
                            Delete this room for good? Everyone inside will be sent out. Your furniture goes back to your inventory.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button variant="contained" color="error" onClick={onDelete}>Yes, delete</Button>
                            <Button onClick={() => setConfirmDelete(false)}>Keep it</Button>
                        </Stack>
                    </Stack>
                ) : (
                    <Button color="error" onClick={() => setConfirmDelete(true)}>Delete room</Button>
                )}
            </Box>
            <WindowActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={draft.name.trim().length < 3} onClick={() => onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() })}>
                    Save
                </Button>
            </WindowActions>
        </HabboWindow>
    );
};
