import { createTheme } from '@mui/material/styles';

/** Colors of the Habbo client: flat blue title bars, gray window bodies, dark toolbar. */
export const habbo = {
    blue: '#1e7295',
    blueDark: '#185d79',
    border: '#283f5d',
    window: '#dfdfdf',
    windowDark: '#c6c6c6',
    tab: '#b6bec5',
    green: '#00800b',
    greenDark: '#006208',
    red: '#a81a12',
    redDark: '#8a140e',
    yellow: '#ffbf00',
    toolbar: '#212131',
    toolbarBorder: '#3b3b52',
    card: '#1c1c20',
    text: '#000000',
    muted: '#555555',
};

export const HABBO_FONT = '"Ubuntu", "Trebuchet MS", Verdana, sans-serif';

/** MUI theme used inside the world client so every control looks like the Habbo client. */
export const habboTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: habbo.blue, dark: habbo.blueDark, contrastText: '#fff' },
        secondary: { main: habbo.green, dark: habbo.greenDark, contrastText: '#fff' },
        error: { main: habbo.red, dark: habbo.redDark },
        warning: { main: '#e0a800', contrastText: '#000' },
        success: { main: habbo.green },
        background: { default: '#000', paper: habbo.window },
        text: { primary: habbo.text, secondary: habbo.muted },
        divider: 'rgba(0,0,0,0.2)',
    },
    shape: { borderRadius: 6 },
    typography: {
        fontFamily: HABBO_FONT,
        fontSize: 13,
        button: { textTransform: 'none', fontWeight: 700 },
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true, size: 'small' },
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    minHeight: 28,
                    padding: '2px 12px',
                    border: '1px solid rgba(0,0,0,0.35)',
                    '&.Mui-disabled': { border: '1px solid rgba(0,0,0,0.15)' },
                },
                contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
                text: { backgroundColor: '#f2f2f2', color: '#000', '&:hover': { backgroundColor: '#e6e6e6' } },
                outlined: { backgroundColor: '#f2f2f2', color: '#000', borderColor: 'rgba(0,0,0,0.35)' },
            },
        },
        MuiIconButton: { styleOverrides: { root: { borderRadius: 6 } } },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiTabs: {
            styleOverrides: {
                root: { minHeight: 28, borderBottom: `1px solid ${habbo.border}` },
                indicator: { display: 'none' },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    minHeight: 28,
                    minWidth: 0,
                    padding: '4px 12px',
                    marginRight: 2,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'none',
                    color: '#000',
                    backgroundColor: habbo.tab,
                    border: `1px solid ${habbo.border}`,
                    borderBottom: 'none',
                    borderRadius: '6px 6px 0 0',
                    '&.Mui-selected': { color: '#000', backgroundColor: habbo.window },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: '#fff',
                    borderRadius: 6,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.45)' },
                },
            },
        },
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiChip: { styleOverrides: { root: { borderRadius: 4, fontWeight: 700, height: 20, fontSize: 11 } } },
        MuiTooltip: {
            styleOverrides: {
                tooltip: { backgroundColor: habbo.card, border: '1px solid #000', fontSize: 11, borderRadius: 4 },
            },
        },
        MuiMenu: { styleOverrides: { paper: { border: `1px solid ${habbo.border}`, backgroundColor: habbo.window } } },
        MuiPopover: { styleOverrides: { paper: { border: `1px solid ${habbo.border}` } } },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.05)' },
                    '&.Mui-selected': { backgroundColor: 'rgba(30,114,149,0.25)' },
                },
            },
        },
    },
});
