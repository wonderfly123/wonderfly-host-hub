// src/components/admin/MenuManagement.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Restaurant as FoodIcon,
  LocalCafe as BeverageIcon,
  Storefront as MerchandiseIcon
} from '@mui/icons-material';
import { getEventById, getEventMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../../utils/api';

const MenuManagement = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuDialog, setMenuDialog] = useState({
    open: false,
    isEdit: false,
    item: {
      name: '',
      description: '',
      price: '',
      category: 'food',
      imageUrl: '',
      available: true,
      customizationOptions: []
    }
  });
  const [customizationDialog, setCustomizationDialog] = useState({
    open: false,
    index: -1,
    option: {
      name: '',
      options: [{ name: '', price: 0 }]
    }
  });
  const [dialogLoading, setDialogLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchEventData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const [eventResponse, menuResponse] = await Promise.all([
        getEventById(eventId),
        getEventMenu(eventId)
      ]);
      
      setEvent(eventResponse.event);
      
      // Organize menu by category
      const menuByCategory = {};
      if (menuResponse.menu) {
        Object.keys(menuResponse.menu).forEach(category => {
          menuByCategory[category] = menuResponse.menu[category];
        });
      }
      
      setMenu(menuByCategory);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load event data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food':
        return <FoodIcon />;
      case 'beverage':
        return <BeverageIcon />;
      case 'merchandise':
        return <MerchandiseIcon />;
      default:
        return <FoodIcon />;
    }
  };

  // Format price as currency
  const formatPrice = (price) => {
    if (!price) return '$0.00';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const handleMenuItemChange = (e) => {
    const { name, value } = e.target;
    setMenuDialog(prev => ({
      ...prev,
      item: {
        ...prev.item,
        [name]: name === 'price' ? (value === '' ? '' : parseFloat(value)) : value
      }
    }));
  };

  const handleCustomizationChange = (e, index) => {
    const { name, value } = e.target;
    setCustomizationDialog(prev => {
      const updatedOption = { ...prev.option };
      if (name === 'optionName') {
        updatedOption.name = value;
      } else if (name.startsWith('choiceName')) {
        const choiceIndex = parseInt(name.split('-')[1]);
        updatedOption.options[choiceIndex].name = value;
      } else if (name.startsWith('choicePrice')) {
        const choiceIndex = parseInt(name.split('-')[1]);
        updatedOption.options[choiceIndex].price = value === '' ? 0 : parseFloat(value);
      }
      return { ...prev, option: updatedOption };
    });
  };

  const addCustomizationChoice = () => {
    setCustomizationDialog(prev => ({
      ...prev,
      option: {
        ...prev.option,
        options: [...prev.option.options, { name: '', price: 0 }]
      }
    }));
  };

  const removeCustomizationChoice = (index) => {
    setCustomizationDialog(prev => {
      const options = [...prev.option.options];
      options.splice(index, 1);
      return {
        ...prev,
        option: {
          ...prev.option,
          options
        }
      };
    });
  };

  const handleOpenMenuDialog = (isEdit = false, item = null) => {
    if (isEdit && item) {
      setMenuDialog({
        open: true,
        isEdit,
        item: { ...item }
      });
    } else {
      setMenuDialog({
        open: true,
        isEdit: false,
        item: {
          name: '',
          description: '',
          price: '',
          category: 'food',
          imageUrl: '',
          available: true,
          customizationOptions: []
        }
      });
    }
  };

  const handleOpenCustomizationDialog = (index = -1, option = null) => {
    if (index >= 0 && option) {
      setCustomizationDialog({
        open: true,
        index,
        option: { ...option }
      });
    } else {
      setCustomizationDialog({
        open: true,
        index: -1,
        option: {
          name: '',
          options: [{ name: '', price: 0 }]
        }
      });
    }
  };

  const handleSaveCustomization = () => {
    const { index, option } = customizationDialog;
    
    setMenuDialog(prev => {
      const customizationOptions = [...prev.item.customizationOptions];
      if (index >= 0) {
        customizationOptions[index] = option;
      } else {
        customizationOptions.push(option);
      }
      
      return {
        ...prev,
        item: {
          ...prev.item,
          customizationOptions
        }
      };
    });
    
    setCustomizationDialog({
      open: false,
      index: -1,
      option: {
        name: '',
        options: [{ name: '', price: 0 }]
      }
    });
  };

  const handleRemoveCustomization = (index) => {
    setMenuDialog(prev => {
      const customizationOptions = [...prev.item.customizationOptions];
      customizationOptions.splice(index, 1);
      
      return {
        ...prev,
        item: {
          ...prev.item,
          customizationOptions
        }
      };
    });
  };

  const handleSaveMenuItem = async () => {
    const { isEdit, item } = menuDialog;
    
    // Validation
    if (!item.name || !item.description || item.price === '') {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    
    try {
      setDialogLoading(true);
      
      const itemData = {
        ...item,
        eventId
      };
      
      if (isEdit) {
        await updateMenuItem(item.id, itemData);
      } else {
        await createMenuItem(itemData);
      }
      
      // Refresh menu
      await fetchEventData();
      
      setMenuDialog({
        open: false,
        isEdit: false,
        item: {
          name: '',
          description: '',
          price: '',
          category: 'food',
          imageUrl: '',
          available: true,
          customizationOptions: []
        }
      });
      
      setSnackbar({
        open: true,
        message: `Menu item ${isEdit ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error saving menu item:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEdit ? 'update' : 'create'} menu item`,
        severity: 'error'
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteMenuItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }
    
    try {
      await deleteMenuItem(item.id);
      
      // Refresh menu
      await fetchEventData();
      
      setSnackbar({
        open: true,
        message: 'Menu item deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete menu item',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            Menu Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {event?.name} - Manage food, beverages, and merchandise
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenMenuDialog()}
        >
          Add Menu Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Food Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <FoodIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Food</Typography>
        </Box>
        
        {!menu.food || menu.food.length === 0 ? (
          <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
            No food items added yet. Click "Add Menu Item" to get started.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {menu.food.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card variant={item.available ? "outlined" : "elevation"} sx={{ height: '100%' }}>
                  {item.imageUrl && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.imageUrl}
                      alt={item.name}
                    />
                  )}
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" gutterBottom>
                        {item.name}
                      </Typography>
                      <Chip 
                        label={item.available ? "Available" : "Unavailable"}
                        color={item.available ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {item.description}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatPrice(item.price)}
                    </Typography>
                    {item.customizationOptions && item.customizationOptions.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="subtitle2">Customization Options:</Typography>
                        <List dense>
                          {item.customizationOptions.map((option, idx) => (
                            <ListItem key={idx} disableGutters>
                              <ListItemText 
                                primary={option.name}
                                secondary={`${option.options.length} choices`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenMenuDialog(true, item)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteMenuItem(item)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Beverage Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <BeverageIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Beverages</Typography>
        </Box>
        
        {!menu.beverage || menu.beverage.length === 0 ? (
          <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
            No beverage items added yet. Click "Add Menu Item" to get started.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {menu.beverage.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card variant={item.available ? "outlined" : "elevation"} sx={{ height: '100%' }}>
                  {item.imageUrl && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.imageUrl}
                      alt={item.name}
                    />
                  )}
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" gutterBottom>
                        {item.name}
                      </Typography>
                      <Chip 
                        label={item.available ? "Available" : "Unavailable"}
                        color={item.available ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {item.description}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatPrice(item.price)}
                    </Typography>
                    {item.customizationOptions && item.customizationOptions.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="subtitle2">Customization Options:</Typography>
                        <List dense>
                          {item.customizationOptions.map((option, idx) => (
                            <ListItem key={idx} disableGutters>
                              <ListItemText 
                                primary={option.name}
                                secondary={`${option.options.length} choices`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenMenuDialog(true, item)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteMenuItem(item)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Merchandise Section */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <MerchandiseIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Merchandise</Typography>
        </Box>
        
        {!menu.merchandise || menu.merchandise.length === 0 ? (
          <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
            No merchandise items added yet. Click "Add Menu Item" to get started.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {menu.merchandise.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card variant={item.available ? "outlined" : "elevation"} sx={{ height: '100%' }}>
                  {item.imageUrl && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.imageUrl}
                      alt={item.name}
                    />
                  )}
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" gutterBottom>
                        {item.name}
                      </Typography>
                      <Chip 
                        label={item.available ? "Available" : "Unavailable"}
                        color={item.available ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {item.description}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatPrice(item.price)}
                    </Typography>
                    {item.customizationOptions && item.customizationOptions.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="subtitle2">Customization Options:</Typography>
                        <List dense>
                          {item.customizationOptions.map((option, idx) => (
                            <ListItem key={idx} disableGutters>
                              <ListItemText 
                                primary={option.name}
                                secondary={`${option.options.length} choices`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenMenuDialog(true, item)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteMenuItem(item)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Menu Item Dialog */}
      <Dialog open={menuDialog.open} onClose={() => setMenuDialog(prev => ({ ...prev, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>
          {menuDialog.isEdit ? 'Edit Menu Item' : 'Add Menu Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Item Name"
                name="name"
                value={menuDialog.item.name}
                onChange={handleMenuItemChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={menuDialog.item.description}
                onChange={handleMenuItemChange}
                fullWidth
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Price"
                name="price"
                type="number"
                value={menuDialog.item.price}
                onChange={handleMenuItemChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={menuDialog.item.category}
                  onChange={handleMenuItemChange}
                  label="Category"
                >
                  <MenuItem value="food">Food</MenuItem>
                  <MenuItem value="beverage">Beverage</MenuItem>
                  <MenuItem value="merchandise">Merchandise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Image URL (Optional)"
                name="imageUrl"
                value={menuDialog.item.imageUrl}
                onChange={handleMenuItemChange}
                fullWidth
                placeholder="https://example.com/image.jpg"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  name="available"
                  value={menuDialog.item.available}
                  onChange={handleMenuItemChange}
                  label="Availability"
                >
                  <MenuItem value={true}>Available</MenuItem>
                  <MenuItem value={false}>Unavailable</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Customization Options */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} mt={1}>
                <Typography variant="subtitle1">Customization Options</Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenCustomizationDialog()}
                >
                  Add Option
                </Button>
              </Box>
              
              {menuDialog.item.customizationOptions.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                  No customization options added yet.
                </Typography>
              ) : (
                <List>
                  {menuDialog.item.customizationOptions.map((option, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={option.name}
                        secondary={`${option.options.length} choices`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleOpenCustomizationDialog(index, option)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleRemoveCustomization(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMenuDialog(prev => ({ ...prev, open: false }))}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveMenuItem}
            disabled={dialogLoading}
            startIcon={dialogLoading ? <CircularProgress size={20} /> : null}
          >
            {dialogLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customization Option Dialog */}
      <Dialog open={customizationDialog.open} onClose={() => setCustomizationDialog(prev => ({ ...prev, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>
          {customizationDialog.index >= 0 ? 'Edit Customization Option' : 'Add Customization Option'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Option Name"
                name="optionName"
                value={customizationDialog.option.name}
                onChange={handleCustomizationChange}
                fullWidth
                required
                placeholder="e.g., Size, Toppings, etc."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Choices</Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={addCustomizationChoice}
                >
                  Add Choice
                </Button>
              </Box>
              
              {customizationDialog.option.options.map((choice, index) => (
                <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                  <Grid item xs={7}>
                    <TextField
                      label="Choice Name"
                      name={`choiceName-${index}`}
                      value={choice.name}
                      onChange={(e) => handleCustomizationChange(e, index)}
                      fullWidth
                      size="small"
                      placeholder="e.g., Small, Extra Cheese, etc."
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Additional Price"
                      name={`choicePrice-${index}`}
                      type="number"
                      value={choice.price}
                      onChange={(e) => handleCustomizationChange(e, index)}
                      fullWidth
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeCustomizationChoice(index)}
                      disabled={customizationDialog.option.options.length <= 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomizationDialog(prev => ({ ...prev, open: false }))}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveCustomization}
            disabled={!customizationDialog.option.name || customizationDialog.option.options.some(opt => !opt.name)}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MenuManagement;