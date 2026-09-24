import { Box } from '@mui/material';
import { Columns, Screenshot, SiteBox, SiteLayout } from '../site/Site';
import { LoginForm } from '../site/LoginForm';

export const Login = () => (
    <SiteLayout>
        <Columns
            leftWidth={360}
            left={(
                <SiteBox title="Sign in to EduVerse">
                    <LoginForm />
                </SiteBox>
            )}
            right={(
                <SiteBox title="Your friends are waiting">
                    <Screenshot src="own-room.png" alt="Friends hanging out in a student's room" />
                    <Box sx={{ mt: 1.25 }}>
                        Sign in to jump back into the Main Hall, visit your classroom, or decorate your own room.
                    </Box>
                </SiteBox>
            )}
        />
    </SiteLayout>
);
