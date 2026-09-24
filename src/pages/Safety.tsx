import { Box } from '@mui/material';
import { Columns, Screenshot, SiteBox, SiteLayout, site } from '../site/Site';

/** How EduVerse keeps students safe (for students, parents and teachers). */
export const Safety = () => (
    <SiteLayout>
        <Columns
            leftWidth={360}
            left={(
                <>
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
                    <SiteBox title="Be a good neighbour" color={site.red}>
                        Be kind, keep personal details to yourself, and report anyone who makes you feel unsafe.
                    </SiteBox>
                </>
            )}
            right={(
                <>
                    <SiteBox title="For parents and teachers">
                        <Screenshot src="classroom.png" alt="A classroom with students at desks" />
                        <Box sx={{ mt: 1.25 }}>
                            Teachers control their classrooms: they can see every whisper in their room, turn on quiet mode,
                            and move troublemakers out. Room owners can mute, kick and ban people in their own rooms.
                        </Box>
                    </SiteBox>
                </>
            )}
        />
    </SiteLayout>
);
