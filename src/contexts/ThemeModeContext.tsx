import { createContext, useState, useMemo, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ColorMode = {
    toggleColorMode: () => void;
};

export const ThemeModeContext = createContext<ColorMode>({
    toggleColorMode: () => { },
});

type ThemeModeProviderProps = {
    children: ReactNode;
};

export const ThemeModeProvider = ({ children }: ThemeModeProviderProps) => {
    const [mode, setMode] = useState<'light' | 'dark'>('dark');

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
        }),
        []
    );

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: '#1e7295',
                        light: '#3c8db5',
                        dark: '#185d79',
                    },
                    secondary: {
                        main: '#00800b',
                        light: '#2aa336',
                        dark: '#006208',
                    },
                    background: {
                        default: mode === 'dark' ? '#10212b' : '#dfdfdf',
                        paper: mode === 'dark' ? '#16303d' : '#ececec',
                    },
                    text: {
                        primary: mode === 'dark' ? '#ffffff' : '#000000',
                        secondary: mode === 'dark' ? '#B0B0B0' : '#666666',
                    },
                },
                typography: {
                    fontFamily: "'Ubuntu', 'Trebuchet MS', 'Helvetica', 'Arial', sans-serif",
                    h1: {
                        fontWeight: 700,
                    },
                    h2: {
                        fontWeight: 600,
                    },
                    h3: {
                        fontWeight: 600,
                    },
                },
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 6,
                                textTransform: 'none',
                                fontWeight: 700,
                                boxShadow: 'none',
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                borderRadius: 8,
                                backgroundImage: 'none',
                            },
                        },
                    },
                },
            }),
        [mode]
    );

    return (
        <ThemeModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeModeContext.Provider>
    );
};
