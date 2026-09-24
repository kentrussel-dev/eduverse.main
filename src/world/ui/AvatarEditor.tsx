import { useEffect, useState } from 'react';
import { Box, Button, ButtonBase, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import { HabboWindow, WindowActions } from './HabboWindow';
import { habbo } from './habboTheme';
import { avatarThumbnail } from '../thumbnails';
import { AvatarLook, CatalogItem, CatalogKind, Profile } from '../types';

/** Style choices per slot. Paid ones are unlocked by buying the matching clothing item in the shop. */
const styles: Record<'hairStyle' | 'top' | 'bottom' | 'hat', { value: string; label: string }[]> = {
    hairStyle: [
        { value: 'short', label: 'Short' }, { value: 'long', label: 'Long' }, { value: 'spiky', label: 'Spiky' },
        { value: 'bun', label: 'Bun' }, { value: 'curly', label: 'Curly' }, { value: 'pigtails', label: 'Pigtails' },
        { value: 'bald', label: 'Bald' },
    ],
    top: [
        { value: 'tshirt', label: 'T-shirt' }, { value: 'longsleeve', label: 'Long sleeve' }, { value: 'uniform', label: 'School polo' },
        { value: 'hoodie', label: 'Cardigan' }, { value: 'dress', label: 'Dress' }, { value: 'jersey', label: 'V-neck' },
    ],
    bottom: [{ value: 'pants', label: 'Pants' }, { value: 'shorts', label: 'Shorts' }, { value: 'skirt', label: 'Skirt' }],
    hat: [
        { value: 'none', label: 'None' }, { value: 'cap', label: 'Cap' }, { value: 'beanie', label: 'Bandana' },
        { value: 'bow', label: 'Headband' }, { value: 'party', label: 'Holiday hat' }, { value: 'headphones', label: 'Sunglasses' },
        { value: 'gradcap', label: 'Top hat' }, { value: 'crown', label: 'Crown' },
    ],
};

type Gender = 'boy' | 'girl';

/** Which styles each gender's wardrobe shows. */
const wardrobe: Record<Gender, Record<Section, string[]>> = {
    boy: {
        hairStyle: ['short', 'spiky', 'curly', 'bald'],
        top: ['tshirt', 'longsleeve', 'uniform', 'hoodie', 'jersey'],
        bottom: ['pants', 'shorts'],
        hat: ['none', 'cap', 'beanie', 'party', 'headphones', 'gradcap', 'crown'],
    },
    girl: {
        hairStyle: ['long', 'bun', 'pigtails', 'curly', 'short'],
        top: ['tshirt', 'longsleeve', 'uniform', 'hoodie', 'dress', 'jersey'],
        bottom: ['skirt', 'pants', 'shorts'],
        hat: ['none', 'bow', 'cap', 'beanie', 'party', 'headphones', 'crown'],
    },
};

/** Switches a look to a gender, swapping any style that gender's wardrobe doesn't have. */
const withGender = (look: AvatarLook, gender: Gender): AvatarLook => {
    const next: AvatarLook = { ...look, gender };
    (Object.keys(wardrobe[gender]) as Section[]).forEach((key) => {
        if (!wardrobe[gender][key].includes(next[key])) next[key] = wardrobe[gender][key][0];
    });
    return next;
};

const palettes = {
    skin: ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'],
    hair: ['#1b1b1b', '#4a3021', '#8b5a2b', '#d4a017', '#f4d06f', '#b22222', '#ff8fab', '#6a4c93', '#2a9d8f', '#e5e5e5'],
    shirt: ['#3f7fd9', '#e63946', '#2a9d8f', '#f4a261', '#9b5de5', '#ffffff', '#264653', '#ffd166', '#ff8fab', '#06d6a0'],
    pants: ['#2d3a4a', '#1b1b1b', '#6c757d', '#3a5a40', '#7f5539', '#1d3557', '#8d99ae', '#e63946', '#ff8fab'],
    shoes: ['#333333', '#ffffff', '#e63946', '#3f7fd9', '#7f5539', '#ffd166'],
    hatColor: ['#e63946', '#3f7fd9', '#2a9d8f', '#ffd166', '#9b5de5', '#ff8fab', '#1b1b1b', '#ffffff'],
};

type Section = 'hairStyle' | 'top' | 'bottom' | 'hat';
const sections: { key: Section; label: string; colors: (keyof typeof palettes)[] }[] = [
    { key: 'hairStyle', label: 'Hair', colors: ['hair', 'skin'] },
    { key: 'top', label: 'Top', colors: ['shirt'] },
    { key: 'bottom', label: 'Bottom', colors: ['pants', 'shoes'] },
    { key: 'hat', label: 'Hat', colors: ['hatColor'] },
];

const colorLabels: Record<keyof typeof palettes, string> = {
    skin: 'Skin', hair: 'Hair color', shirt: 'Top color', pants: 'Bottom color', shoes: 'Shoes', hatColor: 'Hat color',
};

const Thumb = ({ look, size = 64 }: { look: AvatarLook; size?: number }) => {
    const [src, setSrc] = useState('');
    // Keyed by value so a new-but-equal look object doesn't redraw.
    const key = JSON.stringify(look);
    useEffect(() => {
        let alive = true;
        avatarThumbnail(JSON.parse(key)).then((url) => alive && setSrc(url));
        return () => {
            alive = false;
        };
    }, [key]);
    return src ? <img src={src} alt="" style={{ height: size, imageRendering: 'pixelated' }} /> : <Box sx={{ height: size }} />;
};

interface Props {
    profile: Profile;
    catalog: CatalogItem[];
    onClose: () => void;
    onSave: (look: AvatarLook) => void;
    onOpenShop: () => void;
}

export const AvatarEditor = ({ profile, catalog, onClose, onSave, onOpenShop }: Props) => {
    const [draft, setDraft] = useState<AvatarLook>({ ...profile.look, gender: profile.look.gender ?? 'boy' });
    const gender: Gender = draft.gender ?? 'boy';
    const [section, setSection] = useState<Section>('hairStyle');

    const slotName = (key: Section) => (key === 'hairStyle' ? 'hairStyle' : key);
    const shopItem = (key: Section, value: string) =>
        catalog.find((i) => i.kind === CatalogKind.Clothing && i.slot === slotName(key) && i.value === value);
    const locked = (key: Section, value: string) => {
        const item = shopItem(key, value);
        return item ? !profile.clothing.includes(item.id) : false;
    };
    const current = sections.find((s) => s.key === section)!;
    const draftLocked = sections.some((s) => locked(s.key, draft[s.key]));

    return (
        <HabboWindow title="Character" onClose={onClose} width={580}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ minWidth: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: habbo.windowDark, border: `1px solid ${habbo.border}`, borderRadius: 1.5, p: 2 }}>
                    <Thumb look={draft} size={170} />
                    <Typography variant="subtitle2" mt={1}>{profile.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                        {(['boy', 'girl'] as Gender[]).map((g) => (
                            <Button
                                key={g}
                                size="small"
                                variant={gender === g ? 'contained' : 'outlined'}
                                onClick={() => setDraft(withGender(draft, g))}
                            >
                                {g === 'boy' ? 'Boy' : 'Girl'}
                            </Button>
                        ))}
                    </Box>
                </Box>
                <Box flex={1} minWidth={0}>
                    <Tabs value={section} onChange={(_, v) => setSection(v)} variant="scrollable" sx={{ mb: 1 }}>
                        {sections.map((s) => <Tab key={s.key} value={s.key} label={s.label} />)}
                    </Tabs>
                    <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(72px, 1fr))" gap={1}>
                        {styles[section].filter((option) => wardrobe[gender][section].includes(option.value)).map((option) => {
                            const isLocked = locked(section, option.value);
                            const selected = draft[section] === option.value;
                            const price = shopItem(section, option.value)?.price;
                            return (
                                <Tooltip key={option.value} title={isLocked ? `${option.label}: ${price} coins in the shop` : option.label}>
                                    <ButtonBase
                                        onClick={() => setDraft({ ...draft, [section]: option.value })}
                                        aria-label={option.label}
                                        sx={{
                                            flexDirection: 'column', borderRadius: 2, p: 0.5, position: 'relative',
                                            border: selected ? `2px solid ${habbo.blue}` : '2px solid rgba(0,0,0,0.15)',
                                            bgcolor: selected ? '#cfe3ec' : '#ececec',
                                            opacity: isLocked ? 0.6 : 1,
                                        }}
                                    >
                                        <Thumb look={{ ...draft, [section]: option.value }} size={60} />
                                        <Typography variant="caption" noWrap>{option.label}</Typography>
                                        {isLocked && (
                                            <Box sx={{ position: 'absolute', top: 2, right: 4, fontSize: 11 }}>🔒 {price}</Box>
                                        )}
                                    </ButtonBase>
                                </Tooltip>
                            );
                        })}
                    </Box>
                    {current.colors.map((colorKey) => (
                        <Box key={colorKey} mt={1.5}>
                            <Typography variant="caption" color="text.secondary">{colorLabels[colorKey]}</Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.75} mt={0.5}>
                                {palettes[colorKey].map((color) => (
                                    <Box
                                        key={color}
                                        component="button"
                                        aria-label={`${colorLabels[colorKey]} ${color}`}
                                        onClick={() => setDraft({ ...draft, [colorKey]: color })}
                                        sx={{
                                            width: 26, height: 26, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
                                            border: draft[colorKey] === color ? '3px solid #000' : '1px solid rgba(0,0,0,0.4)',
                                            outline: 'none',
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
            <WindowActions>
                {draftLocked && (
                    <Typography variant="body2" color="warning.main" sx={{ mr: 'auto', ml: 2 }}>
                        Some items are locked.
                        <Button size="small" onClick={onOpenShop}>Open shop</Button>
                    </Typography>
                )}
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={draftLocked} onClick={() => onSave(draft)}>
                    Save look
                </Button>
            </WindowActions>
        </HabboWindow>
    );
};
