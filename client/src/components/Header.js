// src/components/Header.js
import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AuthContext } from '../contexts/AuthContext';
import NotificationCenter from './notifications/NotificationCenter';

const Header = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    handleClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // If we're on login pages, don't show the header
  if (location.pathname === '/admin/login' || location.pathname === '/guest/login') {
    return null;
  }

  // If user is logged in, show appropriate navigation
  if (user) {
    // Admin header
    if (isAdmin()) {
      return (
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component={Link} to="/admin/dashboard" style={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
              Wonderfly Host Hub
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <NotificationCenter />
              <Button color="inherit" component={Link} to="/admin/dashboard">Dashboard</Button>
              <Button color="inherit" component={Link} to="/admin/events">Events</Button>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </Box>
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <NotificationCenter />
              <IconButton
                size="large"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => handleMenuItemClick('/admin/dashboard')}>Dashboard</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('/admin/events')}>Events</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      );
    }
    
    // Guest header - show links based on event ID
    const eventId = user.currentEvent?.id;
    
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Link} to={`/event/${eventId}`} style={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
            Wonderfly Host Hub
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <NotificationCenter />
            <Button color="inherit" component={Link} to={`/event/${eventId}/music`}>Music</Button>
            <Button color="inherit" component={Link} to={`/event/${eventId}/order`}>Order</Button>
            <Button color="inherit" component={Link} to={`/event/${eventId}/timeline`}>Schedule</Button>
            <Button color="inherit" component={Link} to={`/event/${eventId}/polls`}>Polls</Button>
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <NotificationCenter />
            <IconButton
              size="large"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleMenuItemClick(`/event/${eventId}/music`)}>Music</MenuItem>
              <MenuItem onClick={() => handleMenuItemClick(`/event/${eventId}/order`)}>Order</MenuItem>
              <MenuItem onClick={() => handleMenuItemClick(`/event/${eventId}/timeline`)}>Schedule</MenuItem>
              <MenuItem onClick={() => handleMenuItemClick(`/event/${eventId}/polls`)}>Polls</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }
  
  // Default header for logged out users
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" style={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
          Wonderfly Host Hub
        </Typography>
        <Button color="inherit" component={Link} to="/guest/login">Join Event</Button>
        <Button color="inherit" component={Link} to="/admin/login">Admin</Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;