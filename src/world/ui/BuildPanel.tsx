import { Box, Button, ButtonBase, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { FurniImage } from './ShopDialog';
import { CatalogItem, Dir } from '../types';

interface Props {
    /** Docked in the side column (desktop) instead of floating over the room (phones). */
    docked: boolean;
    inventory: Record<string, number>;
    catalog: CatalogItem[];
    placing: { type: string; dir: Dir } | null;
    selectedName: string | null;
    onPick: (type: string | null) => void;
    onRotatePlacing: () => void;
    onRotateSelected: () => void;
    onPickUpSelected: () => void;
    onOpenShop: () => void;
    onClose: () => void;
}

/** The room owner's inventory: pick an item, then click the floor to place it. */
export const BuildPanel = (props: Props) => {
    const { inventory, catalog, placing, selectedName } = props;
    const items = Object.entries(inventory).filter(([, count]) => count > 0);
    const nameOf = (type: string) => catalog.find((i) => i.id === type)?.name ?? type;

    return (
        <Paper
            square={props.docked}
            sx={props.docked
                ? { height: '100%', p: 1.5, overflow: 'auto' }
                : { position: 'absolute', left: 12, right: 12, top: 72, maxHeight: '45%', overflow: 'auto', p: 1.5, bgcolor: 'rgba(20,20,35,0.95)', zIndex: 2 }}
        >
            <Stack direction="row" alignItems="center" mb={1}>
                <Typography variant="subtitle2" flex={1}>🧱 Build mode: your inventory</Typography>
                <IconButton size="small" onClick={props.onClose} aria-label="Close build mode"><CloseIcon fontSize="small" /></IconButton>
            </Stack>

            {items.length === 0 ? (
                <Typography variant="body2" color="text.secondary" mb={1}>
                    Your inventory is empty. <Button size="small" onClick={props.onOpenShop}>Visit the shop</Button>
                </Typography>
            ) : (
                <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(64px, 1fr))" gap={0.75} sx={{ maxHeight: props.docked ? 'none' : 150, overflow: 'auto' }}>
                    {items.map(([type, count]) => (
                        <Tooltip key={type} title={nameOf(type)}>
                            <ButtonBase
                                onClick={() => props.onPick(type)}
                                aria-label={`Place ${nameOf(type)}`}
                                sx={{
                                    flexDirection: 'column', p: 0.5, borderRadius: 1.5, position: 'relative',
                                    border: placing?.type === type ? '2px solid #818cf8' : '2px solid rgba(255,255,255,0.08)',
                                    bgcolor: placing?.type === type ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                                }}
                            >
                                <FurniImage type={type} size={40} />
                                <Box sx={{ position: 'absolute', top: 1, right: 4, fontSize: 11, fontWeight: 700 }}>×{count}</Box>
                            </ButtonBase>
                        </Tooltip>
                    ))}
                </Box>
            )}

            <Box mt={1}>
                {placing ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" flex={1}>Click the floor to place <b>{nameOf(placing.type)}</b>.</Typography>
                        <Button size="small" startIcon={<RotateRightIcon />} onClick={props.onRotatePlacing}>Rotate</Button>
                        <Button size="small" onClick={() => props.onPick(null)}>Done</Button>
                    </Stack>
                ) : selectedName ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" flex={1}>Selected: <b>{selectedName}</b></Typography>
                        <Button size="small" startIcon={<RotateRightIcon />} onClick={props.onRotateSelected}>Rotate</Button>
                        <Button size="small" color="warning" onClick={props.onPickUpSelected}>Pick up</Button>
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Pick an item to place it, or click furniture in the room to rotate or pick it up.
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};
