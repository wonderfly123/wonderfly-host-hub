// Updated App.js with event selector routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Header from './components/Header';

// Auth Components
import AdminLogin from './components/auth/AdminLogin';
import GuestLogin from './components/auth/GuestLogin';

// Home/Landing Page
import Home from './components/Home';

// Admin Components
import Dashboard from './components/admin/Dashboard';
import EventManagement from './components/admin/EventManagement';
import CreateEvent from './components/admin/CreateEvent';
import EditEvent from './components/admin/EditEvent';
import MenuManagement from './components/admin/MenuManagement';
import EventSelector from './components/admin/EventSelector';

// New Admin Components
import AdminMusicControl from './components/admin/AdminMusicControl';
import AdminTimeline from './components/admin/AdminTimeline';
import AdminPolls from './components/admin/AdminPolls';
import AdminAnnouncements from './components/admin/AdminAnnouncements';

// Event Components
import EventHome from './components/events/EventHome';
import MusicControl from './components/music/MusicControl';
import OrderSystem from './components/orders/OrderSystem';
import Timeline from './components/timeline/Timeline';
import Polls from './components/polls/Polls';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Header />
            <main style={{ padding: '2rem' }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/guest/login" element={<GuestLogin />} />
                
                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/events" element={<EventManagement />} />
                <Route path="/admin/events/create" element={<CreateEvent />} />
                <Route path="/admin/events/:eventId/edit" element={<EditEvent />} />
                <Route path="/admin/events/:eventId/menu" element={<MenuManagement />} />
                
                {/* Event Selector Routes */}
                <Route path="/admin/select-event/music" element={<EventSelector featureType="music" />} />
                <Route path="/admin/select-event/orders" element={<EventSelector featureType="orders" />} />
                <Route path="/admin/select-event/timeline" element={<EventSelector featureType="timeline" />} />
                <Route path="/admin/select-event/polls" element={<EventSelector featureType="polls" />} />
                <Route path="/admin/select-event/announcements" element={<EventSelector featureType="announcements" />} />
                
                {/* New Admin Routes */}
                <Route path="/admin/events/:eventId/music" element={<AdminMusicControl />} />
                <Route path="/admin/events/:eventId/timeline" element={<AdminTimeline />} />
                <Route path="/admin/events/:eventId/polls" element={<AdminPolls />} />
                <Route path="/admin/events/:eventId/announcements" element={<AdminAnnouncements />} />
                
                {/* Guest Routes */}
                <Route path="/event/:eventId" element={<EventHome />} />
                <Route path="/event/:eventId/music" element={<MusicControl />} />
                <Route path="/event/:eventId/order" element={<OrderSystem />} />
                <Route path="/event/:eventId/timeline" element={<Timeline />} />
                <Route path="/event/:eventId/polls" element={<Polls />} />
                
                {/* Catch All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;