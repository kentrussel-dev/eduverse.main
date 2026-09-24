import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#1e7295', // --primary
            light: '#3c8db5', // --primary-light
            dark: '#185d79', // --primary-dark
        },
        secondary: {
            main: '#00800b', // Habbo green, for the main call to action
            light: '#2aa336',
            dark: '#006208',
        },
        background: {
            default: '#10212b',
            paper: '#16303d',
        },
        text: {
            primary: '#ffffff', // --text-primary
            secondary: 'rgba(255, 255, 255, 0.7)', // --text-secondary
            disabled: 'rgba(255, 255, 255, 0.5)', // --text-disabled
        },
    },
    shape: {
        borderRadius: 6,
    },
    typography: {
        fontFamily: [
            'Ubuntu',
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
