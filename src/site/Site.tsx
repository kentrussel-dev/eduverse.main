import { ReactNode } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * The public website, styled after the classic Habbo Hotel site: sky blue page, blocky logo,
 * blue tab bar, white boxes with colored title strips, big green "Enter" button. No animation.
 */

export const site = {
    sky: '#8ecae6',
    skyDark: '#6fb1d3',
    blue: '#1e7295',
    blueDark: '#185d79',
    navy: '#0e3f52',
    green: '#00800b',
    greenDark: '#005a08',
    orange: '#e8830c',
    red: '#b3261e',
    yellow: '#ffcc00',
    text: '#222',
    muted: '#555',
    border: '#7a9bb0',
};

const FONT = '"Ubuntu", Verdana, Tahoma, sans-serif';

/** Blocky yellow logo with a black outline, like the Habbo logo. */
export const Logo = ({ size = 40 }: { size?: number }) => (
    <Box
        component="span"
        sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: size,
            letterSpacing: '1px',
            color: site.yellow,
            WebkitTextStroke: `${Math.max(2, size / 14)}px #000`,
            paintOrder: 'stroke fill',
            textShadow: `0 ${Math.max(2, size / 12)}px 0 #000`,
            lineHeight: 1,
            userSelect: 'none',
        }}
    >
        EduVerse
    </Box>
);

/** Clouds drawn as flat pixel blocks. */
const Cloud = ({ left, top, scale = 1 }: { left: string; top: number; scale?: number }) => (
    <Box
        component="svg"
        viewBox="0 0 64 24"
        aria-hidden
        sx={{ position: 'absolute', left, top, width: 128 * scale, height: 48 * scale, shapeRendering: 'crispEdges' }}
    >
        <rect x="8" y="12" width="48" height="10" fill="#fff" />
        <rect x="16" y="6" width="20" height="8" fill="#fff" />
        <rect x="30" y="2" width="16" height="12" fill="#fff" />
        <rect x="8" y="20" width="48" height="2" fill="#d7ecf5" />
    </Box>
);

/** A white content box with a colored title strip. */
export const SiteBox = ({ title, color = site.blue, children, sx }: {
    title?: ReactNode; color?: string; children: ReactNode; sx?: object;
}) => (
    <Box sx={{ bgcolor: '#fff', border: `1px solid ${site.border}`, borderRadius: '6px', overflow: 'hidden', mb: 2, ...sx }}>
        {title && (
            <Box sx={{ bgcolor: color, color: '#fff', px: 1.5, py: 0.75, fontFamily: FONT, fontWeight: 700, fontSize: 14, borderBottom: '1px solid rgba(0,0,0,0.25)' }}>
                {title}
            </Box>
        )}
        <Box sx={{ p: 1.5, fontFamily: 'Verdana, Tahoma, sans-serif', fontSize: 12.5, color: site.text, lineHeight: 1.55 }}>{children}</Box>
    </Box>
);

/** The big green button used for the main action. */
export const BigButton = ({ children, onClick, color = site.green, dark = site.greenDark, type, disabled, fullWidth }: {
    children: ReactNode; onClick?: () => void; color?: string; dark?: string; type?: 'submit'; disabled?: boolean; fullWidth?: boolean;
}) => (
    <ButtonBase
        type={type}
        disabled={disabled}
        onClick={onClick}
        sx={{
            width: fullWidth ? '100%' : 'auto',
            px: 3,
            py: 1.1,
            bgcolor: color,
            color: '#fff',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 17,
            borderRadius: '6px',
            border: `2px solid ${dark}`,
            boxShadow: `inset 0 -3px 0 ${dark}`,
            '&:hover': { bgcolor: dark },
            '&.Mui-disabled': { opacity: 0.6, color: '#fff' },
        }}
    >
        {children}
    </ButtonBase>
);

/** A screenshot with a white frame, like the pictures on the old hotel site. */
export const Screenshot = ({ src, alt, caption }: { src: string; alt: string; caption?: string }) => (
    <Box component="figure" sx={{ m: 0 }}>
        <Box
            component="img"
            src={`${process.env.PUBLIC_URL ?? ''}/screenshots/${src}`}
            alt={alt}
            sx={{ width: '100%', display: 'block', border: '3px solid #fff', outline: `1px solid ${site.border}`, borderRadius: '4px', bgcolor: '#000' }}
        />
        {caption && (
            <Box component="figcaption" sx={{ fontSize: 11.5, color: site.muted, mt: 0.75, fontFamily: 'Verdana, Tahoma, sans-serif' }}>
                {caption}
            </Box>
        )}
    </Box>
);

const tabs = [
    { label: 'Home', to: '/' },
    { label: 'Hotel', to: '/world' },
    { label: 'Safety', to: '/#safety', wideOnly: true },
];

/** Page frame: sky, logo header, tab bar, content, footer. */
export const SiteLayout = ({ children }: { children: ReactNode }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const homeTo = user ? '/dashboard' : '/';

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: site.sky, fontFamily: FONT, color: site.text }}>
            {/* Header */}
            <Box sx={{ position: 'relative', overflow: 'hidden', height: { xs: 96, sm: 118 }, borderBottom: `4px solid ${site.skyDark}` }}>
                <Cloud left="1%" top={58} scale={0.6} />
                <Cloud left="46%" top={14} />
                <Cloud left="88%" top={52} scale={0.7} />
                <Box sx={{ position: 'relative', maxWidth: 980, mx: 'auto', px: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box component={RouterLink} to={homeTo} sx={{ textDecoration: 'none' }}>
                        <Logo size={44} />
                        <Typography sx={{ fontFamily: FONT, fontWeight: 700, color: site.navy, fontSize: 13, mt: 1 }}>
                            The virtual school world
                        </Typography>
                    </Box>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <BigButton onClick={() => navigate(user ? '/world' : '/register')}>
                            {user ? 'Enter EduVerse ›' : 'Join now, it’s free ›'}
                        </BigButton>
                    </Box>
                </Box>
            </Box>

            {/* Tab bar */}
            <Box sx={{ bgcolor: site.blue, borderBottom: `2px solid ${site.navy}` }}>
                <Box sx={{ maxWidth: 980, mx: 'auto', px: 2, display: 'flex', alignItems: 'stretch', gap: 0.5, overflowX: 'auto' }}>
                    {tabs.map((tab) => {
                        const to = tab.to === '/' ? homeTo : tab.to;
                        const active = to !== undefined && location.pathname === to.split('#')[0] && !to.includes('#');
                        const style = {
                            px: 1.75, py: 1, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', textDecoration: 'none',
                            display: tab.wideOnly ? { xs: 'none', sm: 'block' } : 'block',
                            color: active ? site.navy : '#fff', bgcolor: active ? '#fff' : 'transparent',
                            borderRadius: '6px 6px 0 0', mt: 0.5,
                            '&:hover': { bgcolor: active ? '#fff' : site.blueDark },
                        };
                        return <Box key={tab.label} component={RouterLink} to={to} sx={style}>{tab.label}</Box>;
                    })}
                    <Box flex={1} />
                    {user ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#fff', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                            <span>Hi, <b>{user.fullName?.split(' ')[0] || 'friend'}</b></span>
                            <Box component="button" onClick={async () => { await logout(); navigate('/'); }}
                                sx={{ bgcolor: 'transparent', border: 'none', color: '#fff', textDecoration: 'underline', cursor: 'pointer', fontSize: 12.5, fontFamily: FONT }}>
                                Sign out
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, whiteSpace: 'nowrap' }}>
                            <Box component={RouterLink} to="/login" sx={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Sign in</Box>
                            <Box component={RouterLink} to="/register" sx={{ color: site.yellow, fontWeight: 700, fontSize: 13 }}>Register</Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Content */}
            <Box sx={{ maxWidth: 980, mx: 'auto', px: 2, py: 2.5 }}>{children}</Box>

            {/* Footer */}
            <Box sx={{ borderTop: `1px solid ${site.skyDark}`, py: 2, textAlign: 'center', fontSize: 11.5, color: site.navy, fontFamily: 'Verdana, Tahoma, sans-serif' }}>
                EduVerse — a safe virtual world for schools.
            </Box>
        </Box>
    );
};

/** Two columns on wide screens (narrow left, wide right), stacked on phones. */
export const Columns = ({ left, right, leftWidth = 320 }: { left: ReactNode; right: ReactNode; leftWidth?: number }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `${leftWidth}px 1fr` }, gap: 2, alignItems: 'start' }}>
        <Box>{left}</Box>
        <Box>{right}</Box>
    </Box>
);

/** A plain form field in the old-site style. */
export const Field = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <Box component="label" sx={{ display: 'block', mb: 1.25, fontSize: 12, fontWeight: 700, fontFamily: 'Verdana, Tahoma, sans-serif' }}>
        {label}
        <Box
            component="input"
            {...props}
            sx={{
                display: 'block', width: '100%', boxSizing: 'border-box', mt: 0.5, px: 1, py: 0.9, fontSize: 13,
                border: `1px solid ${site.border}`, borderRadius: '4px', bgcolor: '#fff', color: site.text, fontFamily: 'inherit',
                '&:focus': { outline: `2px solid ${site.blue}`, outlineOffset: 0 },
            }}
        />
    </Box>
);

export const Notice = ({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) => (
    <Box sx={{
        mb: 1.5, px: 1.25, py: 1, fontSize: 12.5, borderRadius: '4px',
        bgcolor: kind === 'error' ? '#fde2e1' : '#e3f6e3', color: kind === 'error' ? site.red : site.green,
        border: `1px solid ${kind === 'error' ? '#f1a9a5' : '#9bd39b'}`,
    }}>
        {children}
    </Box>
);
