import { ReactNode, useEffect, useRef, useState } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { habbo } from './habboTheme';

// Windows share one counter so the last one clicked is drawn on top.
let topZ = 1300;

interface Props {
    title: string;
    onClose: () => void;
    children: ReactNode;
    width?: number;
    /** Where the window first appears; defaults to the middle of the screen. */
    initial?: { x: number; y: number };
    /** Content area max height before it scrolls. */
    maxHeight?: number | string;
}

/**
 * A draggable window in the style of the Habbo client: flat blue title bar,
 * gray body, red close button. On phones it docks full-width above the toolbar.
 */
export const HabboWindow = ({ title, onClose, children, width = 380, initial, maxHeight = '70vh' }: Props) => {
    const phone = useMediaQuery('(max-width:600px)');
    const [pos, setPos] = useState(() => initial ?? {
        x: Math.max(8, (window.innerWidth - width) / 2),
        y: Math.max(8, window.innerHeight * 0.12),
    });
    const [z, setZ] = useState(() => ++topZ);
    const drag = useRef<{ dx: number; dy: number } | null>(null);

    useEffect(() => {
        const move = (e: PointerEvent) => {
            if (!drag.current) return;
            setPos({
                x: Math.min(window.innerWidth - 60, Math.max(-width + 60, e.clientX - drag.current.dx)),
                y: Math.min(window.innerHeight - 40, Math.max(0, e.clientY - drag.current.dy)),
            });
        };
        const up = () => {
            drag.current = null;
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, [width]);

    return (
        <Box
            role="dialog"
            aria-label={title}
            onPointerDown={() => setZ(++topZ)}
            sx={{
                position: 'fixed',
                zIndex: z,
                ...(phone
                    ? { left: 6, right: 6, bottom: 110, maxHeight: 'calc(100vh - 130px)' }
                    : { left: pos.x, top: pos.y, width }),
                display: 'flex',
                flexDirection: 'column',
                bgcolor: habbo.window,
                border: `1px solid ${habbo.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                color: habbo.text,
            }}
        >
            <Box
                onPointerDown={(e) => {
                    if (phone || (e.target as HTMLElement).closest('button')) return;
                    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
                }}
                sx={{
                    height: 30,
                    flexShrink: 0,
                    bgcolor: habbo.blue,
                    borderBottom: `1px solid ${habbo.border}`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: phone ? 'default' : 'move',
                    userSelect: 'none',
                    touchAction: 'none',
                }}
            >
                {title}
                <Box
                    component="button"
                    aria-label={`Close ${title}`}
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 6,
                        top: 5,
                        width: 20,
                        height: 20,
                        p: 0,
                        borderRadius: '4px',
                        border: '2px solid #fff',
                        bgcolor: habbo.red,
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: 12,
                        lineHeight: '14px',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: habbo.redDark },
                    }}
                >
                    ✕
                </Box>
            </Box>
            <Box sx={{ p: 1.25, overflow: 'auto', maxHeight }}>{children}</Box>
        </Box>
    );
};

/** A row of buttons pinned to the bottom of a window. */
export const WindowActions = ({ children }: { children: ReactNode }) => (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>{children}</Box>
);
