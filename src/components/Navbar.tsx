import { AppBar, Box, Button, Toolbar, Typography, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import EVLogo from '../assets/EV_LOGO.png';

export const Navbar = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const location = useLocation();

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (<AppBar position="fixed"
        sx={{
            background: isAuthPage ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
            backdropFilter: isAuthPage ? 'none' : 'blur(10px)',
            borderRadius: 0,
            boxShadow: 'none',
            zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        elevation={0}
    >        <Toolbar>
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                    }}
                    onClick={() => navigate('/')}
                >
                    <img
                        src={EVLogo}
                        alt="EduVerse Logo"
                        style={{
                            height: '32px',
                            width: 'auto'
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            display: 'inline-block',
                        }}                >
                        EduVerse
                    </Typography>
                </Box>
                {!isAuthPage && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            color="inherit"
                            onClick={() => navigate('/login')}
                            sx={{ textTransform: 'none' }}
                        >
                            Sign In
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/register')}
                            sx={{
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                textTransform: 'none',
                            }}
                        >
                            Get Started
                        </Button>                    </Box>
                )}
            </Box>
        </Toolbar>
    </AppBar>
    );
};


