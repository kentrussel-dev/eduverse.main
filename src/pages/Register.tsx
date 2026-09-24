import { FormEvent, useState } from 'react';
import { Box, ButtonBase } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BigButton, Columns, Field, Notice, Screenshot, SiteBox, SiteLayout, site } from '../site/Site';

const passwordProblem = (password: string, confirm: string) => {
    if (password !== confirm) return 'Passwords do not match.';
    if (password.length < 6) return 'Password must be at least 6 characters long.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    return null;
};

export const Register = () => {
    const navigate = useNavigate();
    const { register, googleLogin } = useAuth();
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', isTeacher: false });
    const [gender, setGender] = useState<'boy' | 'girl'>('boy');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [key]: key === 'isTeacher' ? e.target.checked : e.target.value });

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const problem = passwordProblem(form.password, form.confirmPassword);
        if (problem) {
            setError(problem);
            return;
        }
        setLoading(true);
        try {
            await register(form.email, form.password, `${form.firstName} ${form.lastName}`.trim(), form.isTeacher, gender);
            setSuccess('Welcome to EduVerse!');
            navigate('/dashboard');
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SiteLayout>
            <Columns
                leftWidth={420}
                left={(
                    <SiteBox title="Create your EduVerse account" color={site.green}>
                        <Box component="form" onSubmit={submit}>
                            {error && <Notice kind="error">{error}</Notice>}
                            {success && <Notice kind="success">{success}</Notice>}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                <Field label="First name" required value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
                                <Field label="Last name" required value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
                            </Box>
                            <Field label="Email" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
                            <Field label="Password" type="password" required value={form.password} onChange={set('password')} autoComplete="new-password" />
                            <Field label="Confirm password" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
                            <Box sx={{ fontSize: 11.5, color: site.muted, mt: -0.5, mb: 1.25 }}>
                                At least 6 characters, with an uppercase letter and a number. Other players only see your first name and last initial.
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, fontSize: 12.5, fontWeight: 700 }}>
                                I’m a:
                                {(['boy', 'girl'] as const).map((g) => (
                                    <Box key={g} component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                                        <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} />
                                        {g === 'boy' ? 'Boy' : 'Girl'}
                                    </Box>
                                ))}
                            </Box>
                            <Box sx={{ fontSize: 11.5, color: site.muted, mt: -0.5, mb: 1 }}>
                                You’ll start with a random character to match. Change it anytime.
                            </Box>
                            <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, fontSize: 12.5, fontWeight: 700 }}>
                                <input type="checkbox" checked={form.isTeacher} onChange={set('isTeacher')} />
                                I’m a teacher
                            </Box>
                            <BigButton type="submit" disabled={loading} fullWidth>{loading ? 'Creating account…' : 'Create account'}</BigButton>
                            <ButtonBase
                                type="button"
                                onClick={() => googleLogin().catch(() => setError('Could not start Google sign-in. Please try again.'))}
                                sx={{ mt: 1, width: '100%', py: 0.9, borderRadius: '6px', border: `1px solid ${site.border}`, bgcolor: '#fff', fontWeight: 700, fontSize: 13, color: site.text, gap: 1, '&:hover': { bgcolor: '#f1f5f8' } }}
                            >
                                <Box component="span" sx={{ color: '#4285f4', fontWeight: 900 }}>G</Box> Sign up with Google
                            </ButtonBase>
                            <Box sx={{ mt: 1.25, fontSize: 12, textAlign: 'center' }}>
                                Already have an account? <RouterLink to="/login" style={{ color: site.blue, fontWeight: 700 }}>Sign in</RouterLink>
                            </Box>
                        </Box>
                    </SiteBox>
                )}
                right={(
                    <>
                        <SiteBox title="What you can do">
                            <Screenshot src="character.png" alt="The character editor" />
                            <Box component="ul" sx={{ m: 0, mt: 1.25, pl: 2.25 }}>
                                <li>Make your own pixel character.</li>
                                <li>Chat and hang out with classmates.</li>
                                <li>Join your teacher’s classroom with a code.</li>
                                <li>Decorate your own room with furniture from the shop.</li>
                            </Box>
                        </SiteBox>
                        <SiteBox title="Parents and teachers" color={site.orange}>
                            Chat is filtered, personal details are blocked, and there are no private messages between strangers.
                            Teachers control their classrooms and can see every whisper in them.
                        </SiteBox>
                    </>
                )}
            />
        </SiteLayout>
    );
};
