import { Box } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BigButton, Columns, Screenshot, SiteBox, SiteLayout, site } from '../site/Site';
import { LoginForm } from '../site/LoginForm';

const Feature = ({ title, color, src, alt, children }: { title: string; color: string; src: string; alt: string; children: string }) => (
    <SiteBox title={title} color={color} sx={{ mb: 0 }}>
        <Screenshot src={src} alt={alt} />
        <Box sx={{ mt: 1 }}>{children}</Box>
    </SiteBox>
);

/** The front page, laid out like the classic Habbo Hotel front page. */
export const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    // Signed-in visitors go straight to their home page.
    if (user) return <Navigate to="/dashboard" replace />;

    return (
        <SiteLayout>
            <Columns
                left={(
                    <>
                        <SiteBox title="Sign in">
                            <LoginForm />
                        </SiteBox>
                        <SiteBox title="New to EduVerse?" color={site.green}>
                            Make a character, meet your classmates and join your teacher’s classroom. It’s free for students and teachers.
                            <Box sx={{ mt: 1.5 }}>
                                <BigButton fullWidth onClick={() => navigate('/register')}>Join now ›</BigButton>
                            </Box>
                        </SiteBox>
                        <SiteBox title="Safe for students" color={site.orange}>
                            <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                                <li>Bad words are hidden automatically.</li>
                                <li>Links, emails and phone numbers are blocked in chat.</li>
                                <li>No private messages between strangers.</li>
                                <li>Teachers can mute, remove and ban.</li>
                                <li>Anyone can report someone in one click.</li>
                                <li>Only first names are shown.</li>
                            </Box>
                        </SiteBox>
                    </>
                )}
                right={(
                    <>
                        <SiteBox title="Welcome to EduVerse!">
                            <Screenshot src="main-hall.png" alt="Students chatting in the Main Hall" caption="The Main Hall, where students from every school hang out." />
                            <Box sx={{ mt: 1.5, fontSize: 13.5 }}>
                                EduVerse is a pixel world for schools. Walk around, chat with classmates, study together
                                in the library and go to class in a virtual classroom with your teacher.
                            </Box>
                        </SiteBox>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Feature title="Virtual classrooms" color={site.blue} src="classroom.png" alt="A classroom with students at desks">
                                Teachers write on the whiteboard, students raise their hands, and quiet mode keeps the lesson on track.
                            </Feature>
                            <Feature title="Design your own room" color={site.green} src="own-room.png" alt="A decorated student room">
                                Get furniture from the shop and decorate your room, then invite friends with a room code.
                            </Feature>
                            <Feature title="Dress up your character" color={site.orange} src="character.png" alt="The character editor">
                                Pick hair, clothes, colors and hats. Save up coins for special items.
                            </Feature>
                            <Feature title="Shop with coins" color={site.red} src="shop.png" alt="The furniture shop">
                                Start with 1000 coins and 100 pieces of furniture, then collect free coins every day for more.
                            </Feature>
                        </Box>
                        <SiteBox title="For teachers" color={site.navy} sx={{ mt: 2 }}>
                            Create a classroom, share its six-letter code with your students, and run your lesson right in the world.
                            You can see every whisper in your room, turn on quiet mode, and move troublemakers out.
                        </SiteBox>
                    </>
                )}
            />
        </SiteLayout>
    );
};
