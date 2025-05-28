import { useAuth } from '../contexts/AuthContext';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <Container>
            <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
                <Typography variant="h4" gutterBottom>
                    Welcome, {user?.fullName}!
                </Typography>
                <Typography variant="body1" gutterBottom>
                    You are logged in as: {user?.email}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Role: {user?.isTeacher ? 'Teacher' : 'Student'}
                </Typography>
                <Box sx={{ mt: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};
