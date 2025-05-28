import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6366f1', // --primary
            light: '#818cf8', // --primary-light
            dark: '#4f46e5', // --primary-dark
        },
        secondary: {
            main: '#8b5cf6', // --secondary
            light: '#a78bfa', // --secondary-light
            dark: '#7c3aed', // --secondary-dark
        },
        background: {
            default: '#1a1a1a', // --bg-dark
            paper: '#2a1b3d', // --bg-light
        },
        text: {
            primary: '#ffffff', // --text-primary
            secondary: 'rgba(255, 255, 255, 0.7)', // --text-secondary
            disabled: 'rgba(255, 255, 255, 0.5)', // --text-disabled
        },
    },
    shape: {
        borderRadius: 8,
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
        button: {
            textTransform: 'none',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },
    },
});
