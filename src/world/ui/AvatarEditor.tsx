import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { AvatarLook } from '../types';

const palettes: Record<keyof AvatarLook, { label: string; colors: string[] }> = {
    skin: { label: 'Skin', colors: ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'] },
    hair: { label: 'Hair', colors: ['#1b1b1b', '#4a3021', '#8b5a2b', '#d4a017', '#b22222', '#6a4c93', '#2a9d8f', '#e5e5e5'] },
    shirt: { label: 'Shirt', colors: ['#3f7fd9', '#e63946', '#2a9d8f', '#f4a261', '#9b5de5', '#ffffff', '#264653', '#ffd166'] },
    pants: { label: 'Pants', colors: ['#2d3a4a', '#1b1b1b', '#6c757d', '#3a5a40', '#7f5539', '#1d3557', '#8d99ae'] },
};

interface Props {
    open: boolean;
    look: AvatarLook;
    onClose: () => void;
    onSave: (look: AvatarLook) => void;
}

/** Front-view preview matching the in-game avatar colors. */
const Preview = ({ look }: { look: AvatarLook }) => (
    <svg width="90" height="150" viewBox="-20 -66 40 70" aria-label="Avatar preview">
        <ellipse cx="0" cy="0" rx="13" ry="6" fill="rgba(0,0,0,0.25)" />
        <rect x="-6" y="-18" width="5" height="18" fill={look.pants} />
        <rect x="1" y="-18" width="5" height="18" fill={look.pants} />
        <rect x="-7" y="-3" width="6" height="3" fill="#222" />
        <rect x="1" y="-3" width="6" height="3" fill="#222" />
        <rect x="-11" y="-38" width="5" height="16" rx="2" fill={look.shirt} opacity="0.8" />
        <rect x="-8" y="-40" width="16" height="23" rx="3" fill={look.shirt} />
        <rect x="6" y="-38" width="5" height="16" rx="2" fill={look.shirt} />
        <circle cx="8.5" cy="-21" r="2.5" fill={look.skin} />
        <rect x="-8" y="-58" width="17" height="18" rx="6" fill={look.skin} />
        <rect x="-9" y="-61" width="19" height="8" rx="4" fill={look.hair} />
        <rect x="-9" y="-56" width="5" height="8" fill={look.hair} />
        <rect x="1" y="-51" width="2" height="3" fill="#1b1b1b" />
        <rect x="5" y="-51" width="2" height="3" fill="#1b1b1b" />
    </svg>
);

export const AvatarEditor = ({ open, look, onClose, onSave }: Props) => {
    const [draft, setDraft] = useState<AvatarLook>(look);

    return (
        <Dialog open={open} onClose={onClose} TransitionProps={{ onEnter: () => setDraft(look) }} maxWidth="xs" fullWidth>
            <DialogTitle>Customize your avatar</DialogTitle>
            <DialogContent>
                <Box display="flex" justifyContent="center" mb={2}>
                    <Preview look={draft} />
                </Box>
                {(Object.keys(palettes) as (keyof AvatarLook)[]).map((part) => (
                    <Box key={part} mb={1.5}>
                        <Typography variant="caption" color="text.secondary">
                            {palettes[part].label}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                            {palettes[part].colors.map((color) => (
                                <Box
                                    key={color}
                                    component="button"
                                    aria-label={`${palettes[part].label} ${color}`}
                                    onClick={() => setDraft({ ...draft, [part]: color })}
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        bgcolor: color,
                                        cursor: 'pointer',
                                        border: draft[part] === color ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                                        outline: draft[part] === color ? '2px solid #6366f1' : 'none',
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={() => onSave(draft)}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};
