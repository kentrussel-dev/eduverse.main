import { Box, Button, ButtonBase, Stack, Tooltip, Typography } from '@mui/material';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { HabboWindow } from './HabboWindow';
import { habbo } from './habboTheme';
import { FurniImage } from './ShopDialog';
import { CatalogItem, Dir } from '../types';
import { FLOORS, SOLID_COLORS, solidId, WALLPAPERS } from '../roomStyles';

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

interface Props {
    /** Only a room's owner can place furniture there. */
    canBuild: boolean;
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
    onPickUpAll: () => void;
    wallpaper: string;
    floor: string;
    onStyle: (wallpaper: string, floor: string) => void;
}

/**
 * The Habbo-style inventory. In your own room, pick an item and click the floor to place it,
 * or click placed furniture to rotate it or pick it up.
 */
export const BuildPanel = (props: Props) => {
    const { inventory, catalog, placing, selectedName, canBuild } = props;
    const items = Object.entries(inventory).filter(([, count]) => count > 0);
    const nameOf = (type: string) => catalog.find((i) => i.id === type)?.name ?? type;

    return (
        <HabboWindow title="Inventory" onClose={props.onClose} width={360} initial={{ x: 16, y: 80 }}>
            {items.length === 0 ? (
                <Typography variant="body2" mb={1}>
                    Your inventory is empty. <Button size="small" onClick={props.onOpenShop}>Open shop</Button>
                </Typography>
            ) : (
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fill, minmax(58px, 1fr))"
                    gap={0.5}
                    sx={{ maxHeight: 190, overflow: 'auto', p: 0.5, bgcolor: habbo.windowDark, border: '1px solid rgba(0,0,0,0.3)', borderRadius: 1 }}
                >
                    {items.map(([type, count]) => (
                        <Tooltip key={type} title={nameOf(type)}>
                            <ButtonBase
                                onClick={() => canBuild && props.onPick(type)}
                                aria-label={`Place ${nameOf(type)}`}
                                sx={{
                                    flexDirection: 'column', p: 0.5, borderRadius: 1, position: 'relative', height: 56,
                                    bgcolor: placing?.type === type ? '#cfe3ec' : '#ececec',
                                    border: placing?.type === type ? `2px solid ${habbo.blue}` : '1px solid rgba(0,0,0,0.3)',
                                }}
                            >
                                <FurniImage type={type} size={40} />
                                <Box sx={{ position: 'absolute', top: 1, right: 3, fontSize: 10, fontWeight: 700 }}>{count}</Box>
                            </ButtonBase>
                        </Tooltip>
                    ))}
                </Box>
            )}

            <Box mt={1}>
                {!canBuild ? (
                    <Typography variant="body2" color="text.secondary">
                        You can place furniture in rooms you own. Create a room in the Navigator.
                    </Typography>
                ) : placing ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" flex={1}>Click the floor to place <b>{nameOf(placing.type)}</b>.</Typography>
                        <Button startIcon={<RotateRightIcon />} onClick={props.onRotatePlacing}>Rotate</Button>
                        <Button variant="contained" onClick={() => props.onPick(null)}>Done</Button>
                    </Stack>
                ) : selectedName ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" flex={1}>Selected: <b>{selectedName}</b></Typography>
                        <Button startIcon={<RotateRightIcon />} onClick={props.onRotateSelected}>Rotate</Button>
                        <Button variant="contained" color="error" onClick={props.onPickUpSelected}>Pick up</Button>
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Pick an item to place it, or click furniture in your room to rotate or pick it up.
                    </Typography>
                )}
            </Box>
            {canBuild && (
                <Box mt={1.5} pt={1} borderTop={`1px solid ${habbo.border}`}>
                    <Typography variant="subtitle2">Room design</Typography>
                    <Typography variant="caption" color="text.secondary">Wallpaper</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                        {WALLPAPERS.map((w) => (
                            <Tooltip key={w.id} title={w.name}>
                                <ButtonBase aria-label={`Wallpaper ${w.name}`} onClick={() => props.onStyle(w.id, props.floor)}
                                    sx={{ width: 28, height: 28, borderRadius: 1, border: props.wallpaper === w.id ? '3px solid #000' : '1px solid rgba(0,0,0,0.4)',
                                        background: w.accent !== undefined ? `repeating-linear-gradient(90deg, ${hex(w.color)} 0 5px, ${hex(w.accent)} 5px 8px)` : hex(w.color) }} />
                            </Tooltip>
                        ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary">Plain wallpaper</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.4} mb={1} sx={{ maxHeight: 76, overflowY: 'auto' }}>
                        {SOLID_COLORS.map((c) => (
                            <ButtonBase key={c} aria-label={`Plain wallpaper ${hex(c)}`} onClick={() => props.onStyle(solidId(c), props.floor)}
                                sx={{ width: 20, height: 20, borderRadius: 0.5, bgcolor: hex(c), border: props.wallpaper === solidId(c) ? '3px solid #000' : '1px solid rgba(0,0,0,0.35)' }} />
                        ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary">Floor</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                        {FLOORS.map((f) => (
                            <Tooltip key={f.id} title={f.name}>
                                <ButtonBase aria-label={`Floor ${f.name}`} onClick={() => props.onStyle(props.wallpaper, f.id)}
                                    sx={{ width: 28, height: 28, borderRadius: 1, border: props.floor === f.id ? '3px solid #000' : '1px solid rgba(0,0,0,0.4)',
                                        background: `conic-gradient(${hex(f.a)} 25%, ${hex(f.b)} 0 50%, ${hex(f.a)} 0 75%, ${hex(f.b)} 0)` }} />
                            </Tooltip>
                        ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary">Plain floor</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.4} mb={1} sx={{ maxHeight: 76, overflowY: 'auto' }}>
                        {SOLID_COLORS.map((c) => (
                            <ButtonBase key={c} aria-label={`Plain floor ${hex(c)}`} onClick={() => props.onStyle(props.wallpaper, solidId(c))}
                                sx={{ width: 20, height: 20, borderRadius: 0.5, bgcolor: hex(c), border: props.floor === solidId(c) ? '3px solid #000' : '1px solid rgba(0,0,0,0.35)' }} />
                        ))}
                    </Box>
                    <Button size="small" variant="outlined" color="error" onClick={props.onPickUpAll}>Pick up all furniture</Button>
                </Box>
            )}
        </HabboWindow>
    );
};
