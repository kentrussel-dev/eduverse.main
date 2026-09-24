import { FormEvent, useEffect, useState } from 'react';
import { Box, ButtonBase } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BigButton, Field, Notice, site } from './Site';

/** Email/password and Google sign-in, used on the front page and the sign-in page. */
export const LoginForm = () => {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Show errors passed in the URL (e.g. from Google sign-in or an expired session).
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const message = params.get('error');
        if (message) {
            setError(decodeURIComponent(message));
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const google = async () => {
        setError('');
        try {
            await googleLogin();
        } catch {
            setError('Could not start Google sign-in. Please try again.');
        }
    };

    return (
        <Box component="form" onSubmit={submit}>
            {error && <Notice kind="error">{error}</Notice>}
            <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <BigButton type="submit" disabled={loading} fullWidth>{loading ? 'Signing in…' : 'Sign in'}</BigButton>
            <ButtonBase
                type="button"
                onClick={google}
                sx={{
                    mt: 1, width: '100%', py: 0.9, borderRadius: '6px', border: `1px solid ${site.border}`, bgcolor: '#fff',
                    fontWeight: 700, fontSize: 13, color: site.text, gap: 1, '&:hover': { bgcolor: '#f1f5f8' },
                }}
            >
                <Box component="span" sx={{ color: '#4285f4', fontWeight: 900 }}>G</Box> Sign in with Google
            </ButtonBase>
            <Box sx={{ mt: 1.25, fontSize: 12, textAlign: 'center' }}>
                New here? <RouterLink to="/register" style={{ color: site.blue, fontWeight: 700 }}>Create an account</RouterLink>
            </Box>
        </Box>
    );
};
