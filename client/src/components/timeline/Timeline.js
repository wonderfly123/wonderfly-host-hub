// client/src/components/timeline/Timeline.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  CircularProgress, 
  Alert, 
  Box, 
  List, 
  ListItem, 
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import { getEventTimeline } from '../../utils/api';

const Timeline = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timelineItems, setTimelineItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching timeline data for event:', eventId);
        
        const response = await getEventTimeline(eventId);
        console.log('Timeline data received:', response);
        
        if (!response.timelineItems || response.timelineItems.length === 0) {
          setTimelineItems([]);
          setLoading(false);
          return;
        }
        
        // Process the timeline items with numerical timestamps for reliable sorting
        const processedItems = response.timelineItems.map(item => {
          const startTime = new Date(item.startTime);
          const endTime = item.endTime ? new Date(item.endTime) : null;
          
          return {
            ...item,
            startTimeObj: startTime,
            endTimeObj: endTime,
            // Add numerical timestamps for reliable sorting
            startTimestamp: startTime.getTime(),
            endTimestamp: endTime ? endTime.getTime() : null
          };
        });
        
        // Sort by numerical timestamp (most reliable)
        const sortedItems = [...processedItems].sort((a, b) => {
          return a.startTimestamp - b.startTimestamp;
        });
        
        console.log('Sorted timeline items:', sortedItems);
        setTimelineItems(sortedItems);
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
    return (
      <Container>
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      </Container>
    );
  }

  if (!timelineItems || timelineItems.length === 0) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>Activities Schedule</Typography>
        <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" color="textSecondary" align="center">
            No activities available yet.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>Activities Schedule</Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <List>
          {timelineItems.map((item, index) => (
            <React.Fragment key={item._id || index}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Typography variant="h6">{item.title}</Typography>
                  }
                  secondary={
                    <Box>
                      <Typography component="span" variant="body1" color="text.primary">
                        {formatTime(item.startTimeObj)}
                        {item.endTimeObj && ` - ${formatTime(item.endTimeObj)}`}
                      </Typography>
                      {item.location && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Location: {item.location}
                        </Typography>
                      )}
                      {item.description && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < timelineItems.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default Timeline;