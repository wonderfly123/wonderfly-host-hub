// server/controllers/music.controller.js
const spotifyService = require('../services/spotify.service');
const Event = require('../models/event.model');
const VotingQueue = require('../models/votingQueue.model');

// Search for tracks
exports.searchTracks = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const tracks = await spotifyService.searchTracks(query);
    res.status(200).json({ tracks });
  } catch (error) {
    console.error('Track search error:', error);
    res.status(500).json({ message: 'Error searching for tracks' });
  }
};

// Get playlist tracks for an event
exports.getEventPlaylist = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (!event.spotify || !event.spotify.playlistId) {
      return res.status(404).json({ message: 'No playlist associated with this event' });
    }
    
    // Get playlist details
    const playlist = await spotifyService.getPlaylist(event.spotify.playlistId);
    
    // Get playlist tracks
    const tracks = await spotifyService.getPlaylistTracks(event.spotify.playlistId);
    
    res.status(200).json({
      playlist,
      tracks
    });
  } catch (error) {
    console.error('Get event playlist error:', error);
    res.status(500).json({ message: 'Error retrieving event playlist' });
  }
};

// Update event playlist
exports.updateEventPlaylist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { playlistId } = req.body;
    
    if (!playlistId) {
      return res.status(400).json({ message: 'Playlist ID is required' });
    }
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Verify the playlist exists in Spotify
    try {
      await spotifyService.getPlaylist(playlistId);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid Spotify playlist ID' });
    }
    
    // Update the event with the new playlist ID
    event.spotify = {
      ...event.spotify,
      playlistId
    };
    
    await event.save();
    
    res.status(200).json({
      message: 'Event playlist updated successfully',
      spotify: event.spotify
    });
  } catch (error) {
    console.error('Update event playlist error:', error);
    res.status(500).json({ message: 'Error updating event playlist' });
  }
};

// Get the voting queue for an event
exports.getVotingQueue = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    let queue = await VotingQueue.findOne({ event: eventId });
    
    if (!queue) {
      // Create an empty queue if none exists
      queue = new VotingQueue({
        event: eventId,
        tracks: [],
        isActive: true
      });
      await queue.save();
    }
    
    res.status(200).json({ queue });
  } catch (error) {
    console.error('Get voting queue error:', error);
    res.status(500).json({ message: 'Error retrieving voting queue' });
  }
};

// Add a track to the voting queue
exports.addTrackToQueue = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { trackId, name, artists, imageUrl } = req.body;
    
    if (!trackId || !name) {
      return res.status(400).json({ message: 'Track ID and name are required' });
    }
    
    let queue = await VotingQueue.findOne({ event: eventId });
    
    if (!queue) {
      queue = new VotingQueue({
        event: eventId,
        tracks: [],
        isActive: true
      });
    }
    
    // Check if track already exists in queue
    const trackExists = queue.tracks.some(track => track.trackId === trackId);
    
    if (trackExists) {
      return res.status(400).json({ message: 'Track already in queue' });
    }
    
    // Add track to queue
    queue.tracks.push({
      trackId,
      name,
      artists,
      imageUrl,
      votes: 1,
      voters: [req.userId],
      addedBy: req.userId
    });
    
    await queue.save();
    
    // Emit socket event to update all clients
    req.app.get('io').to(`event-${eventId}`).emit('queue-updated');
    
    res.status(201).json({
      message: 'Track added to queue',
      track: queue.tracks[queue.tracks.length - 1]
    });
  } catch (error) {
    console.error('Add track to queue error:', error);
    res.status(500).json({ message: 'Error adding track to queue' });
  }
};

// Vote for a track
exports.voteForTrack = async (req, res) => {
  try {
    const { eventId, trackId } = req.params;
    
    let queue = await VotingQueue.findOne({ event: eventId });
    
    if (!queue) {
      return res.status(404).json({ message: 'Voting queue not found' });
    }
    
    // Find the track
    const trackIndex = queue.tracks.findIndex(track => track.trackId === trackId);
    
    if (trackIndex === -1) {
      return res.status(404).json({ message: 'Track not found in queue' });
    }
    
    // Check if user already voted
    const alreadyVoted = queue.tracks[trackIndex].voters.includes(req.userId);
    
    if (alreadyVoted) {
      // Remove vote
      queue.tracks[trackIndex].votes -= 1;
      queue.tracks[trackIndex].voters = queue.tracks[trackIndex].voters.filter(
        voterId => voterId.toString() !== req.userId
      );
    } else {
      // Add vote
      queue.tracks[trackIndex].votes += 1;
      queue.tracks[trackIndex].voters.push(req.userId);
    }
    
    await queue.save();
    
    // Emit socket event to update all clients
    req.app.get('io').to(`event-${eventId}`).emit('queue-updated');
    
    res.status(200).json({
      message: alreadyVoted ? 'Vote removed' : 'Vote added',
      track: queue.tracks[trackIndex]
    });
  } catch (error) {
    console.error('Vote for track error:', error);
    res.status(500).json({ message: 'Error processing vote' });
  }
};