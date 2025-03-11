// src/components/auth/GuestLogin.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Box, 
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';

const GuestLogin = () => {
  const [name, setName] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  
  const { guestLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { event } = await guestLogin({ name, eventCode });
      navigate(`/event/${event.id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      setOpenAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Paper elevation={3}>
          <Box p={4}>
            <Typography variant="h4" align="center" gutterBottom>
              Join an Event
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="name"
                label="Your Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="eventCode"
                label="Event Code"
                id="eventCode"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              />
              <Box mt={2}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Join Event'}
                </Button>
              </Box>
              <Box mt={2} textAlign="center">
                <Button 
                  color="secondary" 
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </Box>
            </form>
          </Box>
        </Paper>
      </Box>
      <Snackbar 
        open={openAlert} 
        autoHideDuration={6000} 
        onClose={() => setOpenAlert(false)}
      >
        <Alert onClose={() => setOpenAlert(false)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GuestLogin;