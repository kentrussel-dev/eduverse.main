import { useEffect, useMemo, useState } from 'react';
import {
    Box, Button, Chip, Paper, Stack, Tab, Tabs, Typography,
} from '@mui/material';
import { HabboWindow } from './HabboWindow';
import { avatarThumbnail, furniThumbnail } from '../thumbnails';
import { CatalogItem, CatalogKind, Profile } from '../types';

export const FurniImage = ({ type, size = 56 }: { type: string; size?: number }) => {
    const [src, setSrc] = useState('');
    useEffect(() => {
        let alive = true;
        furniThumbnail(type).then((url) => alive && setSrc(url));
        return () => {
            alive = false;
        };
    }, [type]);
    return src
        ? <img src={src} alt="" style={{ maxHeight: size, maxWidth: size * 1.4, objectFit: 'contain' }} />
        : <Box sx={{ height: size }} />;
};

/** Shows a clothing item worn by the player's avatar. */
const ClothingImage = ({ item, profile, size = 64 }: { item: CatalogItem; profile: Profile; size?: number }) => {
    const [src, setSrc] = useState('');
    const slot = item.slot ?? '';
    const value = item.value ?? '';
    const key = JSON.stringify({ ...profile.look, [slot]: value });
    useEffect(() => {
        let alive = true;
        avatarThumbnail(JSON.parse(key)).then((url) => alive && setSrc(url));
        return () => {
            alive = false;
        };
    }, [key]);
    return src ? <img src={src} alt="" style={{ height: size, imageRendering: 'pixelated' }} /> : <Box sx={{ height: size }} />;
};

export const Coins = ({ amount }: { amount: number }) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, height: 24, borderRadius: '4px', bgcolor: '#ffbf00', border: '1px solid #8a6700', color: '#000', fontWeight: 700, fontSize: 12 }}>
        🪙 {amount}
    </Box>
);

interface Props {
    profile: Profile;
    catalog: CatalogItem[];
    onClose: () => void;
    onBuy: (item: CatalogItem) => Promise<void>;
    onClaimDaily: () => Promise<void>;
}

export const ShopDialog = ({ profile, catalog, onClose, onBuy, onClaimDaily }: Props) => {
    const [tab, setTab] = useState<string>('Seating');
    const [busy, setBusy] = useState<string | null>(null);

    const categories = useMemo(() => Array.from(new Set(catalog.map((i) => i.category))), [catalog]);
    const items = catalog.filter((i) => i.category === tab);

    const buy = async (item: CatalogItem) => {
        setBusy(item.id);
        try {
            await onBuy(item);
        } finally {
            setBusy(null);
        }
    };

    return (
        <HabboWindow title="Shop" onClose={onClose} width={640}>
            <Box>
                <Box display="flex" justifyContent="flex-end" mb={1}><Coins amount={profile.coins} /></Box>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff3c4', borderColor: '#c9a200' }}>
                    <Typography variant="body2" flex={1}>
                        {profile.dailyBonusAvailable
                            ? 'Your daily coins are ready!'
                            : 'You got today’s coins. Come back tomorrow for more.'}
                    </Typography>
                    <Button variant="contained" color="warning" disabled={!profile.dailyBonusAvailable || busy === 'daily'}
                        onClick={async () => {
                            setBusy('daily');
                            try {
                                await onClaimDaily();
                            } finally {
                                setBusy(null);
                            }
                        }}>
                        Get daily coins
                    </Button>
                </Paper>
                <Tabs value={categories.includes(tab) ? tab : categories[0] ?? false} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
                    {categories.map((c) => <Tab key={c} value={c} label={c} />)}
                </Tabs>
                <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap={1.5}>
                    {items.map((item) => {
                        const owned = item.kind === CatalogKind.Clothing && profile.clothing.includes(item.id);
                        const count = item.kind === CatalogKind.Furni ? profile.furni[item.id] ?? 0 : 0;
                        const affordable = profile.coins >= item.price;
                        return (
                            <Paper key={item.id} variant="outlined" sx={{ bgcolor: '#fff', borderColor: 'rgba(0,0,0,0.3)', p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ height: 72, display: 'flex', alignItems: 'center' }}>
                                    {item.kind === CatalogKind.Furni ? <FurniImage type={item.id} size={64} /> : <ClothingImage item={item} profile={profile} size={72} />}
                                </Box>
                                <Typography variant="body2" fontWeight={700} textAlign="center">{item.name}</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2">🪙 {item.price}</Typography>
                                    {count > 0 && <Chip size="small" label={`have ${count}`} />}
                                </Stack>
                                <Button fullWidth size="small" variant="contained" color="secondary" disabled={owned || !affordable || busy === item.id} onClick={() => buy(item)}>
                                    {owned ? 'Owned' : affordable ? 'Buy' : 'Not enough coins'}
                                </Button>
                            </Paper>
                        );
                    })}
                </Box>
            </Box>
        </HabboWindow>
    );
};
