import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Box,
    Typography,
    TextField,
    Button,
    Link,
    Alert,
    Divider,
    LinearProgress,
    FormControlLabel,
    Checkbox,
    IconButton,
    InputAdornment
} from '@mui/material';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FlagIcon from '@mui/icons-material/Flag';
import GoogleIcon from '@mui/icons-material/Google';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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

  & .MuiFormHelperText-root {
    color: #d32f2f;
    margin-left: 0;
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

const StyledCheckbox = styled(FormControlLabel)`
  margin-bottom: 1rem;
  
  & .MuiCheckbox-root {
    color: #6366f1;
    
    &.Mui-checked {
      color: #8b5cf6;
    }
  }
  
  & .MuiFormControlLabel-label {
    color: #0a192f;
  }
`;

export const Register = () => {
    const navigate = useNavigate();
    const { register, googleLogin } = useAuth() ?? {};
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        isTeacher: false
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

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        if (!/[A-Z]/.test(formData.password)) {
            setError('Password must contain at least one uppercase letter');
            return false;
        }
        if (!/[0-9]/.test(formData.password)) {
            setError('Password must contain at least one number');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!register) return;

        setError('');
        setSuccessMessage('');

        if (!validateForm()) return;

        setLoading(true);
        try {
            const fullName = `${formData.firstName} ${formData.lastName}`;
            await register(formData.email, formData.password, fullName, formData.isTeacher);
            setSuccessMessage('Registration successful! Please check your email for confirmation.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(err.response?.data?.message || err.response?.data || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!googleLogin) return;

        setError('');
        setSuccessMessage('');
        setLoading(true);
        try {
            await googleLogin();
            // The page will redirect to Google auth, so no need to navigate
        } catch (err: any) {
            setError('Failed to initiate Google registration. Please try again.');
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
                        <FlagIcon sx={{
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
                            Create Your Account
                        </Typography>
                        <Typography variant="body2" sx={{
                            color: 'text.secondary',
                            mt: 1
                        }}>
                            Begin your journey in interactive learning
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

                    {successMessage && (
                        <Alert severity="success"
                            sx={{
                                mb: 3,
                                borderRadius: '8px',
                                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                color: '#2e7d32',
                                '& .MuiAlert-icon': {
                                    fontSize: '1.5rem',
                                    color: '#2e7d32'
                                }
                            }}
                        >
                            {successMessage}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2
                        }}>
                            <StyledTextField
                                required
                                fullWidth
                                label="First Name"
                                name="firstName"
                                autoComplete="given-name"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                disabled={loading}
                            />
                            <StyledTextField
                                required
                                fullWidth
                                label="Last Name"
                                name="lastName"
                                autoComplete="family-name"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                disabled={loading}
                            />
                        </Box>

                        <StyledTextField
                            required
                            fullWidth
                            label="Email Address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={loading}
                        />

                        <StyledTextField
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            edge="end"
                                            disabled={loading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <StyledTextField
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            disabled={loading}
                            error={formData.confirmPassword !== '' && formData.password !== formData.confirmPassword}
                            helperText={
                                formData.confirmPassword !== '' &&
                                    formData.password !== formData.confirmPassword ?
                                    'Passwords do not match' : ''
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowConfirmPassword}
                                            edge="end"
                                            disabled={loading}
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <StyledCheckbox
                            control={
                                <Checkbox
                                    checked={formData.isTeacher}
                                    onChange={(e) => setFormData({ ...formData, isTeacher: e.target.checked })}
                                    disabled={loading}
                                />
                            }
                            label="I am a teacher"
                        />

                        <GradientButton
                            fullWidth
                            type="submit"
                            disabled={loading}
                            variant="contained"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
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
                            Register with Google
                        </GoogleButton>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Already have an account?{' '}
                                <Link
                                    component="button"
                                    onClick={() => navigate('/login')}
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
                                    Sign In
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </motion.div>
            </RightPanel>
        </Box>
    );
};