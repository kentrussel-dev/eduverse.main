import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { avatarThumbnail } from '../world/thumbnails';
import { AvatarLook } from '../world/types';
import { useAuth } from '../contexts/AuthContext';
import { BigButton, Columns, Screenshot, SiteBox, SiteLayout, site } from '../site/Site';

const places = [
    { name: 'Main Hall', text: 'Meet students from every school.' },
    { name: 'Quiet Library', text: 'Study together. Keep chat on-topic.' },
    { name: 'Classroom 101', text: 'An open classroom any teacher can run.' },
];

interface WorldProfile {
    look: AvatarLook;
    coins: number;
    furniCount: number;
}

/** Your character as it looks in the world, with your coins and furniture. */
const AvatarPreview = ({ onEdit }: { onEdit: () => void }) => {
    const [profile, setProfile] = useState<WorldProfile | null>(null);
    const [picture, setPicture] = useState('');
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let alive = true;
        axios.get<WorldProfile>(`${process.env.REACT_APP_API_URL}/world/profile`)
            .then(async ({ data }) => {
                if (!alive) return;
                setProfile(data);
                const url = await avatarThumbnail(data.look);
                if (alive) setPicture(url);
            })
            .catch(() => alive && setFailed(true));
        return () => {
            alive = false;
        };
    }, []);

    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ width: 110, height: 150, flexShrink: 0, bgcolor: site.sky, border: `1px solid ${site.border}`, borderRadius: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: 1, backgroundImage: 'linear-gradient(transparent 70%, rgba(0,0,0,0.08) 70%)' }}>
                {picture
                    ? <img src={picture} alt="Your character" style={{ maxHeight: 130, maxWidth: 100, imageRendering: 'pixelated' }} />
                    : <Box sx={{ color: site.muted, fontSize: 11, mb: 6 }}>{failed ? 'No preview' : 'Loading…'}</Box>}
            </Box>
            <Box sx={{ fontSize: 13 }}>
                {profile && (
                    <>
                        <Box>🪙 <b>{profile.coins}</b> coins</Box>
                        <Box>🛋️ <b>{profile.furniCount}</b> pieces of furniture</Box>
                    </>
                )}
                <Box component="button" onClick={onEdit}
                    sx={{ mt: 1, bgcolor: site.green, color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: 12, px: 1.25, py: 0.6, cursor: 'pointer' }}>
                    Change clothes ›
                </Box>
            </Box>
        </Box>
    );
};

/** The signed-in home page ("Me" page). */
export const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const firstName = user?.fullName?.split(' ')[0] || 'friend';
    const enter = () => navigate('/world');

    return (
        <SiteLayout>
            <Columns
                leftWidth={340}
                left={(
                    <>
                        <SiteBox title={`Welcome back, ${firstName}!`}>
                            <AvatarPreview onEdit={() => navigate('/world?open=character')} />
                            <Box sx={{ fontSize: 13, mt: 1.5 }}>
                                Signed in as <b>{user?.email}</b>
                                <br />
                                Role: <b>{user?.isTeacher ? 'Teacher' : 'Student'}</b>
                            </Box>
                            <Box sx={{ mt: 1.5 }}>
                                <BigButton fullWidth onClick={enter}>Enter EduVerse ›</BigButton>
                            </Box>
                        </SiteBox>
                        <SiteBox title="Places to visit" color={site.green}>
                            {places.map((place) => (
                                <Box key={place.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: '1px dotted #bbb', '&:last-child': { borderBottom: 'none' } }}>
                                    <Box flex={1}>
                                        <b>{place.name}</b>
                                        <br />
                                        <Box component="span" sx={{ color: site.muted, fontSize: 11.5 }}>{place.text}</Box>
                                    </Box>
                                    <Box component="button" onClick={enter}
                                        sx={{ bgcolor: site.blue, color: '#fff', border: `1px solid ${site.blueDark}`, borderRadius: '4px', fontWeight: 700, fontSize: 11.5, px: 1.25, py: 0.5, cursor: 'pointer' }}>
                                        Go
                                    </Box>
                                </Box>
                            ))}
                        </SiteBox>
                        {user?.isTeacher && (
                            <SiteBox title="Teacher tools" color={site.navy}>
                                Open the <b>Navigator</b> in the world and choose <b>Create room / class</b>. Share the six-letter code
                                with your class. In your classroom, use the <b>Classroom</b> button to write on the whiteboard and turn on quiet mode.
                            </SiteBox>
                        )}
                    </>
                )}
                right={(
                    <>
                        <SiteBox title="What’s happening in EduVerse">
                            <Screenshot src="main-hall.png" alt="The Main Hall" caption="The Main Hall is the lobby. Say hi!" />
                        </SiteBox>
                        <SiteBox title="How to play" color={site.orange}>
                            <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                                <li>Click the floor to walk. Click a chair, sofa or beanbag to sit.</li>
                                <li>Type in the chat box at the bottom to talk. Click someone to whisper or report them.</li>
                                <li>Click your own character for <b>Dance</b>, <b>Wave</b> and <b>Sit</b>.</li>
                                <li>You start with 1000 coins and 100 pieces of furniture. Use the <b>Shop</b> for more, and get free coins every day.</li>
                                <li>Create a furnished apartment or house in the <b>Navigator</b>, then open your <b>Inventory</b> to decorate it.</li>
                            </Box>
                        </SiteBox>
                        <SiteBox title="Be a good neighbour" color={site.red}>
                            Be kind, keep personal details to yourself, and report anyone who makes you feel unsafe. Teachers and room owners
                            can mute, remove and ban people who break the rules.
                        </SiteBox>
                    </>
                )}
            />
        </SiteLayout>
    );
};
