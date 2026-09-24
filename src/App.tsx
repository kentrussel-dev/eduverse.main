import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { World } from './pages/World';
import { LandingPage } from './pages/LandingPage';
import { Safety } from './pages/Safety';
import { Credits } from './pages/Credits';
import { Box } from '@mui/material';
import { theme } from './theme/theme';
import './App.css';

// Each page draws its own header: the site pages use SiteLayout, the world is a full-screen client.
const AppContent = () => {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/world" element={
            <ProtectedRoute>
              <World />
            </ProtectedRoute>
          } />
          <Route path="/safety" element={<Safety />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ThemeModeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ThemeModeProvider>
    </ThemeProvider>
  );
}

export default App;
