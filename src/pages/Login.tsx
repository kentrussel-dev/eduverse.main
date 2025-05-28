import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, TextField, Button, Link, Alert, Divider, LinearProgress } from '@mui/material';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandscapeIcon from '@mui/icons-material/Landscape';
import GoogleIcon from '@mui/icons-material/Google';
import EVLogo from '../assets/EV_LOGO.png';

const LeftPanel = styled(motion.div)`
  background: #1a1a1a;
  position: relative;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  overflow: hidden;
  box-shadow: inset -10px 0 30px rgba(0, 0, 0, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(139, 92, 246, 0.2);
    z-index: 1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('https://assets.codepen.io/3364143/7btrrd.mp4') no-repeat center center;
    background-size: cover;
    z-index: 0;
  }
  
  & > * {
    position: relative;
    z-index: 2;
  }
`;

const RightPanel = styled(motion.div)`
  background: white;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  & > div {
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
  }

  & form {
    width: 100%;
  }
  
  @media (max-width: 900px) {
    padding: 2rem;
  }
`;

const StyledTextField = styled(TextField)`
  margin-bottom: 1.5rem;
  
  & .MuiOutlinedInput-root {
    background: rgba(255, 255, 255, 0.95);
    transition: all 0.3s ease;
    border-radius: 8px;
    
    &:hover {
      background: #ffffff;
      & fieldset {
        border-color: rgba(99, 102, 241, 0.5);
      }
    }
    
    & fieldset {
      border-width: 1px;
      border-color: rgba(10, 25, 47, 0.2);
      transition: border-color 0.2s ease;
    }
    
    &.Mui-focused fieldset {
      border-color: #6366f1;
      border-width: 2px;
      background: rgba(99, 102, 241, 0.02);
    }

    & input {
      color: #0a192f;
      
      &::placeholder {
        color: rgba(10, 25, 47, 0.5);
      }

      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 30px white inset !important;
        -webkit-text-fill-color: #0a192f !important;
        transition: background-color 5000s ease-in-out 0s;
      }
    }
  }

  & .MuiInputLabel-root {
    color: #0a192f;
    
    &.Mui-focused {
      color: #8b5cf6;
    }
  }
`;

const GradientButton = styled(Button)`
  background: linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%);
  color: white;
  padding: 1rem 2rem;
  margin-top: 1rem;
  transition: all 0.3s ease;
  border-radius: 8px;
  text-transform: none;
  font-size: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
    background: linear-gradient(45deg, #5457ea 30%, #7c4ef0 90%);
  }

  &.Mui-disabled {
    background: #ccc;
    color: #666;
  }
`;

const GoogleButton = styled(Button)`
  background: white;
  color: #757575;
  border: 1px solid #dadce0;
  padding: 1rem 2rem;
  margin-top: 1rem;
  transition: all 0.3s ease;
  border-radius: 8px;
  text-transform: none;
  font-size: 1rem;
  
  &:hover {
    background: #f8f9fa;
    border-color: #8b5cf6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.Mui-disabled {
    background: #f5f5f5;
    color: #9e9e9e;
  }

  & .MuiButton-startIcon {
    margin-right: 12px;
  }
`;

export const Login = () => {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth() ?? {};
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    // Check for error in URL when component mounts
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorMsg = params.get('error');
        if (errorMsg) {
            setError(decodeURIComponent(errorMsg));
            // Clean up the URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!login) return;

        setError('');
        setLoading(true);
        try {
            await login(credentials.email, credentials.password);
            navigate('/dashboard');
        } catch (err: any) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!googleLogin) return;

        setError('');
        setLoading(true);
        try {
            await googleLogin();
            // The page will redirect to Google auth, so no need to navigate
        } catch (err: any) {
            setError('Failed to initiate Google login. Please try again.');
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '42fr 58fr' },
            minHeight: '100vh',
        }}>
            <LeftPanel
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, ease: 'easeOut' }}
                    >
                        <img
                            src={EVLogo}
                            alt="EduVerse Logo"
                            style={{
                                width: '200px',
                                height: 'auto',
                                marginBottom: '2rem',
                                filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))'
                            }}
                        />
                    </motion.div>
                </Box>
            </LeftPanel>

            <RightPanel
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, ease: 'easeOut' }}
                >
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <LandscapeIcon sx={{
                            fontSize: 48,
                            color: '#0a192f',
                            mb: 2,
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                        }} />
                        <Typography variant="h4" sx={{
                            fontWeight: 700,
                            color: '#0a192f',
                            letterSpacing: '-0.5px'
                        }}>
                            Enter Your Space
                        </Typography>
                        <Typography variant="body2" sx={{
                            color: 'text.secondary',
                            mt: 1
                        }}>
                            Your interactive classroom awaits
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error"
                            sx={{
                                mb: 3,
                                borderRadius: '8px',
                                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                color: '#d32f2f',
                                '& .MuiAlert-icon': {
                                    fontSize: '1.5rem',
                                    color: '#d32f2f'
                                }
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <StyledTextField
                            fullWidth
                            label="Email"
                            variant="outlined"
                            type="email"
                            value={credentials.email}
                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                            disabled={loading}
                            error={!!error && error.toLowerCase().includes('email')}
                            required
                        />
                        <StyledTextField
                            fullWidth
                            label="Password"
                            variant="outlined"
                            type="password"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            disabled={loading}
                            error={!!error && error.toLowerCase().includes('password')}
                            required
                        />

                        <GradientButton
                            fullWidth
                            type="submit"
                            disabled={loading}
                            variant="contained"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </GradientButton>

                        {loading && (
                            <LinearProgress sx={{
                                mt: 2,
                                borderRadius: '4px',
                                '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)'
                                }
                            }} />
                        )}

                        <Divider sx={{
                            my: 3,
                            color: '#666',
                            '&::before, &::after': {
                                borderColor: 'rgba(0, 0, 0, 0.12)'
                            }
                        }}>
                            or
                        </Divider>

                        <GoogleButton
                            fullWidth
                            variant="outlined"
                            startIcon={<GoogleIcon />}
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            Sign in with Google
                        </GoogleButton>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Link
                                component="button"
                                variant="body2"
                                onClick={() => navigate('/forgot-password')}
                                sx={{
                                    color: '#6366f1',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        color: '#8b5cf6'
                                    }
                                }}
                                disabled={loading}
                            >
                                Forgot Password?
                            </Link>
                        </Box>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Don't have an account?{' '}
                                <Link
                                    component="button"
                                    onClick={() => navigate('/register')}
                                    sx={{
                                        color: '#6366f1',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            color: '#8b5cf6'
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    Sign Up
                                </Link>
                            </Typography>
                        </Box>
                    </form>
                </motion.div>
            </RightPanel>
        </Box>
    );
};