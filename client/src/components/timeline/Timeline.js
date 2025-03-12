// client/src/components/timeline/Timeline.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, CircularProgress, Alert, Box } from '@mui/material';
import axios from 'axios';

const Timeline = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching timeline data for event:', eventId);
        
        // Make a direct request to ensure we see everything
        const response = await axios.get(`http://localhost:5002/api/timeline/event/${eventId}`);
        console.log('TIMELINE DATA:', response.data);
        
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Timeline error:', err);
        setError(err.message || 'Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  if (loading) {
    return <Container><CircularProgress /></Container>;
  }

  if (error) {
    return <Container><Alert severity="error">{error}</Alert></Container>;
  }

  // Just display raw data for debugging
  return (
    <Container>
      <Typography variant="h4">Timeline Data (Debug)</Typography>
      <Box component="pre" sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 2, maxHeight: '400px', overflow: 'auto' }}>
        {JSON.stringify(data, null, 2)}
      </Box>
    </Container>
  );
};

export default Timeline;