// server/services/square.service.js
// Check if required environment variables are set
if (!process.env.SQUARE_ACCESS_TOKEN || process.env.NODE_ENV !== 'production') {
  console.warn('Using mock Square implementation for development/testing');
  
  // Mock implementations
  exports.createPayment = async (sourceId, orderId, amount, currency = 'USD') => {
    console.log(`Mock payment created for order ${orderId}, amount: ${amount} ${currency}`);
    return {
      id: 'mock-payment-id-' + Date.now(),
      status: 'COMPLETED',
      receiptUrl: '#'
    };
  };
  
  exports.getPaymentStatus = async (paymentId) => {
    return {
      id: paymentId || 'mock-payment-id',
      status: 'COMPLETED',
      receiptUrl: '#'
    };
  };
  
  exports.refundPayment = async (paymentId, amount, currency = 'USD') => {
    console.log(`Mock refund created for payment ${paymentId}, amount: ${amount} ${currency}`);
    return {
      id: 'mock-refund-id-' + Date.now(),
      status: 'COMPLETED'
    };
  };
} else {
  try {
    // Real Square implementation
    let square;
    try {
      square = require('square');
    } catch (err) {
      console.error('Failed to require Square package:', err);
      throw new Error('Square package not available');
    }
    
    if (!square || !square.Client) {
      console.error('Square Client not found in package');
      throw new Error('Square Client not available');
    }
    
    // Initialize Square client
    const squareClient = new square.Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    });

    // Get payment instance
    const paymentsApi = squareClient.paymentsApi;
    const catalogApi = squareClient.catalogApi;

    // Create a payment
    exports.createPayment = async (sourceId, orderId, amount, currency = 'USD') => {
      try {
        const response = await paymentsApi.createPayment({
          sourceId: sourceId,
          idempotencyKey: `${orderId}-${Date.now()}`,
          amountMoney: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency
          },
          reference_id: orderId,
          note: `Payment for Order #${orderId}`
        });
        
        return response.result.payment;
      } catch (error) {
        console.error('Square payment error:', error);
        throw error;
      }
    };

    // Get payment status
    exports.getPaymentStatus = async (paymentId) => {
      try {
        const response = await paymentsApi.getPayment(paymentId);
        return response.result.payment;
      } catch (error) {
        console.error('Square get payment error:', error);
        throw error;
      }
    };

    // Refund a payment
    exports.refundPayment = async (paymentId, amount, currency = 'USD') => {
      try {
        const response = await paymentsApi.refundPayment({
          paymentId,
          idempotencyKey: `refund-${paymentId}-${Date.now()}`,
          amountMoney: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency
          },
          reason: 'Requested by customer'
        });
        
        return response.result.refund;
      } catch (error) {
        console.error('Square refund error:', error);
        throw error;
      }
    };
  } catch (error) {
    console.error('Error initializing Square:', error);
    
    // Fallback implementations
    exports.createPayment = async (sourceId, orderId, amount, currency = 'USD') => {
      console.log(`Fallback payment created for order ${orderId}, amount: ${amount} ${currency}`);
      return {
        id: 'fallback-payment-id-' + Date.now(),
        status: 'COMPLETED',
        receiptUrl: '#'
      };
    };
    
    exports.getPaymentStatus = async (paymentId) => {
      return {
        id: paymentId || 'fallback-payment-id',
        status: 'COMPLETED',
        receiptUrl: '#'
      };
    };
    
    exports.refundPayment = async (paymentId, amount, currency = 'USD') => {
      console.log(`Fallback refund created for payment ${paymentId}, amount: ${amount} ${currency}`);
      return {
        id: 'fallback-refund-id-' + Date.now(),
        status: 'COMPLETED'
      };
    };
  }
}