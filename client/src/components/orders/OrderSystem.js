// src/components/orders/OrderSystem.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Tabs,
  Tab,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Delete as DeleteIcon,
  LocalDining as DiningIcon,
  LocalCafe as CafeIcon,
  Storefront as StoreIcon,
  Room as LocationIcon
} from '@mui/icons-material';
import { getEventMenu, createOrder, getUserOrders } from '../../utils/api';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`menu-tabpanel-${index}`}
      aria-labelledby={`menu-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const OrderSystem = () => {
  const { eventId } = useParams();
  const [menu, setMenu] = useState({});
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [customizationDialog, setCustomizationDialog] = useState({
    open: false,
    item: null,
    selections: {}
  });
  const [locationDialog, setLocationDialog] = useState({
    open: false,
    location: ''
  });
  const [orderStatus, setOrderStatus] = useState({
    loading: false,
    success: false,
    error: null
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchOrders();
  }, [eventId]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await getEventMenu(eventId);
      setMenu(response.menu || {});
    } catch (error) {
      console.error('Error fetching menu:', error);
      setError('Failed to load menu. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await getUserOrders();
      // Filter orders for this event
      const eventOrders = response.orders.filter(
        order => order.event === eventId
      );
      setOrders(eventOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddToCart = (item) => {
    // If item has customization options, show dialog
    if (item.customizationOptions && item.customizationOptions.length > 0) {
      setCustomizationDialog({
        open: true,
        item,
        selections: {}
      });
      return;
    }
    
    // Otherwise, add directly to cart
    addItemToCart(item);
  };

  const handleCustomizationChange = (optionName, selectedValue) => {
    setCustomizationDialog(prev => ({
      ...prev,
      selections: {
        ...prev.selections,
        [optionName]: selectedValue
      }
    }));
  };

  const addItemToCart = (item, customizations = []) => {
    const newItem = {
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity: 1,
      customizations,
      subtotal: calculateSubtotal(item.price, customizations)
    };
    
    setCart(prev => [...prev, newItem]);
  };

  const calculateSubtotal = (basePrice, customizations = []) => {
    const customizationTotal = customizations.reduce(
      (sum, customization) => sum + customization.price, 
      0
    );
    return basePrice + customizationTotal;
  };

  const handleConfirmCustomizations = () => {
    const { item, selections } = customizationDialog;
    
    // Convert selections to array format
    const customizations = [];
    for (const [optionName, selectedValue] of Object.entries(selections)) {
      const option = item.customizationOptions.find(opt => opt.name === optionName);
      if (option) {
        const chosenOption = option.options.find(opt => opt.name === selectedValue);
        if (chosenOption) {
          customizations.push({
            name: optionName,
            option: selectedValue,
            price: chosenOption.price
          });
        }
      }
    }
    
    // Add to cart
    addItemToCart(item, customizations);
    
    // Close dialog
    setCustomizationDialog({
      open: false,
      item: null,
      selections: {}
    });
  };

  const handleRemoveFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
   
   setCart(prev => {
     const newCart = [...prev];
     newCart[index].quantity = newQuantity;
     newCart[index].subtotal = calculateSubtotal(
       newCart[index].price, 
       newCart[index].customizations
     ) * newQuantity;
     return newCart;
   });
 };

 const handleOpenLocationDialog = () => {
   setLocationDialog({
     open: true,
     location: ''
   });
 };

 const handleLocationChange = (e) => {
   setLocationDialog(prev => ({
     ...prev,
     location: e.target.value
   }));
 };

 const handlePlaceOrder = async () => {
   if (!locationDialog.location.trim()) return;
   
   try {
     setOrderStatus({
       loading: true,
       success: false,
       error: null
     });
     
     await createOrder({
       eventId,
       items: cart,
       deliveryLocation: locationDialog.location,
       notes: ''
     });
     
     // Clear cart and close dialog
     setCart([]);
     setLocationDialog({
       open: false,
       location: ''
     });
     
     // Set success state and fetch latest orders
     setOrderStatus({
       loading: false,
       success: true,
       error: null
     });
     
     fetchOrders();
     
     // Reset success state after 3 seconds
     setTimeout(() => {
       setOrderStatus(prev => ({
         ...prev,
         success: false
       }));
     }, 3000);
     
   } catch (error) {
     console.error('Error placing order:', error);
     setOrderStatus({
       loading: false,
       success: false,
       error: 'Failed to place order. Please try again.'
     });
   }
 };

 // Calculate cart total
 const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

 // Get list of categories
 const categories = Object.keys(menu);

 // Format price as currency
 const formatPrice = (price) => {
   return `$${price.toFixed(2)}`;
 };

 // Get status chip for orders
 const getStatusChip = (status) => {
   let color;
   switch (status) {
     case 'pending':
       color = 'default';
       break;
     case 'processing':
       color = 'primary';
       break;
     case 'ready':
       color = 'secondary';
       break;
     case 'delivered':
       color = 'success';
       break;
     case 'cancelled':
       color = 'error';
       break;
     default:
       color = 'default';
   }
   return <Chip size="small" label={status} color={color} />;
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
     <Box mt={4} mb={4}>
       <Typography variant="h4" component="h1" gutterBottom>
         Order Food & Drinks
       </Typography>
       <Typography variant="subtitle1" color="textSecondary" paragraph>
         Browse the menu and place your order
       </Typography>
     </Box>

     {error && (
       <Alert severity="error" sx={{ mb: 3 }}>
         {error}
       </Alert>
     )}

     {orderStatus.success && (
       <Alert severity="success" sx={{ mb: 3 }}>
         Order placed successfully!
       </Alert>
     )}

     {orderStatus.error && (
       <Alert severity="error" sx={{ mb: 3 }}>
         {orderStatus.error}
       </Alert>
     )}

     <Grid container spacing={3}>
       {/* Menu Section */}
       <Grid item xs={12} md={8}>
         <Paper elevation={3}>
           {Object.keys(menu).length === 0 ? (
             <Box p={4} textAlign="center">
               <DiningIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
               <Typography variant="h6" gutterBottom>
                 Menu Not Available
               </Typography>
               <Typography variant="body1" color="textSecondary">
                 The menu for this event is not available yet.
               </Typography>
             </Box>
           ) : (
             <>
               <Tabs
                 value={tabValue}
                 onChange={handleTabChange}
                 indicatorColor="primary"
                 textColor="primary"
                 variant="scrollable"
                 scrollButtons="auto"
               >
                 {categories.map((category, index) => {
                   let icon;
                   switch (category) {
                     case 'food':
                       icon = <DiningIcon />;
                       break;
                     case 'beverage':
                       icon = <CafeIcon />;
                       break;
                     case 'merchandise':
                       icon = <StoreIcon />;
                       break;
                     default:
                       icon = <DiningIcon />;
                   }
                   
                   return (
                     <Tab 
                       key={category} 
                       label={category.charAt(0).toUpperCase() + category.slice(1)} 
                       icon={icon}
                       iconPosition="start"
                     />
                   );
                 })}
               </Tabs>

               {categories.map((category, index) => (
                 <TabPanel key={category} value={tabValue} index={index}>
                   <Grid container spacing={2}>
                     {menu[category].map(item => (
                       <Grid item xs={12} sm={6} key={item.id}>
                         <Card variant="outlined">
                           {item.imageUrl && (
                             <CardMedia
                               component="img"
                               height="140"
                               image={item.imageUrl}
                               alt={item.name}
                             />
                           )}
                           <CardContent>
                             <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                               <Typography variant="h6" gutterBottom>
                                 {item.name}
                               </Typography>
                               <Typography variant="h6" color="primary">
                                 {formatPrice(item.price)}
                               </Typography>
                             </Box>
                             <Typography variant="body2" color="textSecondary" paragraph>
                               {item.description}
                             </Typography>
                             {item.customizationOptions && item.customizationOptions.length > 0 && (
                               <Typography variant="caption" color="textSecondary">
                                 Customization options available
                               </Typography>
                             )}
                           </CardContent>
                           <CardActions>
                             <Button
                               startIcon={<AddIcon />}
                               color="primary"
                               onClick={() => handleAddToCart(item)}
                             >
                               Add to Order
                             </Button>
                           </CardActions>
                         </Card>
                       </Grid>
                     ))}
                   </Grid>
                 </TabPanel>
               ))}
             </>
           )}
         </Paper>
       </Grid>

       {/* Cart Section */}
       <Grid item xs={12} md={4}>
         <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
           <Box display="flex" alignItems="center" mb={2}>
             <Badge badgeContent={cart.length} color="primary" sx={{ mr: 1 }}>
               <CartIcon color="action" />
             </Badge>
             <Typography variant="h6">
               Your Order
             </Typography>
           </Box>

           {cart.length === 0 ? (
             <Typography variant="body1" color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
               Your cart is empty. Add items from the menu.
             </Typography>
           ) : (
             <>
               <List>
                 {cart.map((item, index) => (
                   <React.Fragment key={index}>
                     <ListItem>
                       <ListItemText
                         primary={item.name}
                         secondary={
                           <>
                             {formatPrice(item.price)}
                             {item.customizations && item.customizations.length > 0 && (
                               <Box mt={0.5}>
                                 {item.customizations.map((customization, i) => (
                                   <Typography key={i} variant="caption" display="block">
                                     +{customization.name}: {customization.option} 
                                     {customization.price > 0 && ` (${formatPrice(customization.price)})`}
                                   </Typography>
                                 ))}
                               </Box>
                             )}
                           </>
                         }
                       />
                       <Box display="flex" alignItems="center">
                         <IconButton 
                           size="small" 
                           onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                         >
                           <RemoveIcon fontSize="small" />
                         </IconButton>
                         <Typography sx={{ mx: 1 }}>
                           {item.quantity}
                         </Typography>
                         <IconButton 
                           size="small" 
                           onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                         >
                           <AddIcon fontSize="small" />
                         </IconButton>
                       </Box>
                       <ListItemSecondaryAction>
                         <Box display="flex" flexDirection="column" alignItems="flex-end">
                           <Typography variant="body2">
                             {formatPrice(item.subtotal)}
                           </Typography>
                           <IconButton 
                             edge="end" 
                             size="small" 
                             onClick={() => handleRemoveFromCart(index)}
                           >
                             <DeleteIcon fontSize="small" />
                           </IconButton>
                         </Box>
                       </ListItemSecondaryAction>
                     </ListItem>
                     <Divider component="li" />
                   </React.Fragment>
                 ))}
               </List>

               <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                 <Box display="flex" justifyContent="space-between" mb={1}>
                   <Typography variant="body1">Subtotal:</Typography>
                   <Typography variant="body1">{formatPrice(cartTotal)}</Typography>
                 </Box>
                 <Box display="flex" justifyContent="space-between">
                   <Typography variant="h6">Total:</Typography>
                   <Typography variant="h6" color="primary">{formatPrice(cartTotal)}</Typography>
                 </Box>
               </Box>

               <Button
                 variant="contained"
                 color="primary"
                 fullWidth
                 size="large"
                 startIcon={<CartIcon />}
                 onClick={handleOpenLocationDialog}
                 sx={{ mt: 2 }}
               >
                 Place Order
               </Button>
             </>
           )}

           {/* Recent Orders Section */}
           <Box mt={4}>
             <Typography variant="h6" gutterBottom>
               Your Recent Orders
             </Typography>
             
             {ordersLoading ? (
               <Box display="flex" justifyContent="center" my={2}>
                 <CircularProgress size={24} />
               </Box>
             ) : orders.length === 0 ? (
               <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                 You haven't placed any orders yet.
               </Typography>
             ) : (
               <List>
                 {orders.slice(0, 3).map(order => (
                   <React.Fragment key={order.id}>
                     <ListItem>
                       <ListItemText
                         primary={
                           <Box display="flex" alignItems="center">
                             <Typography variant="body1" component="span">
                               Order #{order.orderNumber.slice(-6)}
                             </Typography>
                             <Box ml={1}>
                               {getStatusChip(order.status)}
                             </Box>
                           </Box>
                         }
                         secondary={
                           <>
                             <Typography variant="caption" display="block" color="textSecondary">
                               {new Date(order.createdAt).toLocaleString()}
                             </Typography>
                             <Typography variant="body2" sx={{ mt: 0.5 }}>
                               {formatPrice(order.totalAmount)} • {order.items.length} item(s)
                             </Typography>
                             <Box display="flex" alignItems="center" mt={0.5}>
                               <LocationIcon fontSize="small" sx={{ mr: 0.5 }} color="action" />
                               <Typography variant="caption">
                                 {order.deliveryLocation}
                               </Typography>
                             </Box>
                           </>
                         }
                       />
                     </ListItem>
                     <Divider component="li" />
                   </React.Fragment>
                 ))}
               </List>
             )}
           </Box>
         </Paper>
       </Grid>
     </Grid>

     {/* Customization Dialog */}
     <Dialog open={customizationDialog.open} onClose={() => setCustomizationDialog(prev => ({ ...prev, open: false }))}>
       <DialogTitle>Customize Your Order</DialogTitle>
       <DialogContent>
         {customizationDialog.item && (
           <>
             <Typography variant="h6">{customizationDialog.item.name}</Typography>
             <Typography variant="body2" color="textSecondary" paragraph>
               Select your preferences
             </Typography>
             
             {customizationDialog.item.customizationOptions.map((option) => (
               <FormControl fullWidth margin="normal" key={option.name}>
                 <InputLabel id={`${option.name}-label`}>{option.name}</InputLabel>
                 <Select
                   labelId={`${option.name}-label`}
                   value={customizationDialog.selections[option.name] || ''}
                   onChange={(e) => handleCustomizationChange(option.name, e.target.value)}
                   label={option.name}
                 >
                   {option.options.map((choice) => (
                     <MenuItem value={choice.name} key={choice.name}>
                       {choice.name}
                       {choice.price > 0 && ` (+${formatPrice(choice.price)})`}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
             ))}
           </>
         )}
       </DialogContent>
       <DialogActions>
         <Button onClick={() => setCustomizationDialog(prev => ({ ...prev, open: false }))}>
           Cancel
         </Button>
         <Button 
           onClick={handleConfirmCustomizations} 
           color="primary"
           disabled={customizationDialog.item && customizationDialog.item.customizationOptions.some(
             option => !customizationDialog.selections[option.name]
           )}
         >
           Add to Order
         </Button>
       </DialogActions>
     </Dialog>

     {/* Location Dialog */}
     <Dialog open={locationDialog.open} onClose={() => setLocationDialog(prev => ({ ...prev, open: false }))}>
       <DialogTitle>Delivery Location</DialogTitle>
       <DialogContent>
         <Typography variant="body2" color="textSecondary" paragraph>
           Please provide your table number or location for delivery
         </Typography>
         <TextField
           autoFocus
           margin="normal"
           label="Table/Location"
           fullWidth
           variant="outlined"
           value={locationDialog.location}
           onChange={handleLocationChange}
           placeholder="e.g., Table 12, Bar Area, etc."
         />
       </DialogContent>
       <DialogActions>
         <Button onClick={() => setLocationDialog(prev => ({ ...prev, open: false }))}>
           Cancel
         </Button>
         <Button 
           onClick={handlePlaceOrder} 
           color="primary"
           disabled={!locationDialog.location.trim() || orderStatus.loading}
           startIcon={orderStatus.loading ? <CircularProgress size={20} /> : null}
         >
           {orderStatus.loading ? 'Processing...' : 'Confirm Order'}
         </Button>
       </DialogActions>
     </Dialog>
   </Container>
 );
};

export default OrderSystem;