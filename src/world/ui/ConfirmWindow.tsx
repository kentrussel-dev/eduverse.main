import { Box, Button, Typography } from '@mui/material';
import { HabboWindow, WindowActions } from './HabboWindow';

interface Props {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

/** A Habbo-style "are you sure?" window. */
export const ConfirmWindow = ({ title, message, confirmLabel = 'OK', onConfirm, onCancel }: Props) => (
    <HabboWindow title={title} onClose={onCancel} width={320}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', py: 1 }}>
            <Box sx={{ fontSize: 34, lineHeight: 1 }}>❓</Box>
            <Typography variant="body2">{message}</Typography>
        </Box>
        <WindowActions>
            <Button onClick={onCancel}>Cancel</Button>
            <Button variant="contained" color="success" onClick={onConfirm} autoFocus>{confirmLabel}</Button>
        </WindowActions>
    </HabboWindow>
);
