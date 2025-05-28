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
                        main: '#6C63FF',
                        light: '#8F88FF',
                        dark: '#4B45B3',
                    },
                    secondary: {
                        main: '#FF6584',
                        light: '#FF89A1',
                        dark: '#B3475C',
                    },
                    background: {
                        default: mode === 'dark' ? '#121212' : '#f5f5f5',
                        paper: mode === 'dark' ? '#1E1E1E' : '#ffffff',
                    },
                    text: {
                        primary: mode === 'dark' ? '#ffffff' : '#000000',
                        secondary: mode === 'dark' ? '#B0B0B0' : '#666666',
                    },
                },
                typography: {
                    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
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
                                borderRadius: 8,
                                textTransform: 'none',
                                fontWeight: 600,
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                borderRadius: 12,
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
