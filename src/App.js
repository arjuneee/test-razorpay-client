import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  // Mock mode toggle (for testing without real API calls)
  const [mockMode, setMockMode] = useState(true);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('');
      setOrderDetails(null);

      // Step 1: Create order on your backend
      let orderResponse;
      
      if (mockMode) {
        // Mock response
        orderResponse = {
          data: {
            orderId: `mock_order_${Math.random().toString(36).substring(7)}`,
            amount: amount,
            currency: 'INR'
          }
        };
        console.log('Mock order created:', orderResponse.data);
      } else {
        // Real API call
        orderResponse = await axios.post('https://dev.api.v2.bylukz.com/v1/customer/wallet/create-order', {
          amount: parseFloat(amount) || 100,
          currency: 'INR'
        }, {
          headers:{
            Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NjhhNmE0NC03MTBhLTRmODItYTE4ZC1iZmFiYmExOGU4NDciLCJqdGkiOiJkZTFlNTc2MS02NTEzLTQzOTMtYjg5YS1lYTU1ZTdmN2MxZWMiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NTAxNDM0OTksImV4cCI6MTc1MTA0MzQ5OX0.w-imdeAycuq04z-jzdGi9xUXF5qBoqfis90D8kdR13c'
          }
        });
      }

      setOrderDetails(orderResponse.data);
      console.log('Order created:', orderResponse.data);

      // Step 2: Initialize Razorpay checkout
      const options = {
        key: "rzp_test_TIWKJQDU6dYAbe",
        amount: (parseFloat(amount) * 100).toString(),
        currency: 'INR',
        name: 'E-Commerce App',
        description: 'Payment for order',
        order_id: orderResponse.data?.data?.orderId,
        handler: async function(response) {
          if (mockMode) {
            console.log('Mock payment successful', response);
            setPaymentStatus('Payment successful (mock)');
            return;
          }
          
          try {
            // Verify payment with backend
            // await axios.post('/payments/verify', {
            //   razorpay_payment_id: response.razorpay_payment_id,
            //   razorpay_order_id: response.razorpay_order_id,
            //   razorpay_signature: response.razorpay_signature
            // });
            setPaymentStatus('Payment successful');
          } catch (error) {
            console.error('Verification failed:', error);
            setPaymentStatus('Payment verification failed');
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9876543210'
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('Payment window closed');
          }
        }
      };

      if (mockMode) {
        // Simulate payment success after 2 seconds
        setTimeout(() => {
          options.handler({
            razorpay_payment_id: `mock_pay_${Math.random().toString(36).substring(7)}`,
            razorpay_order_id: orderResponse.data.orderId,
            razorpay_signature: `mock_sig_${Math.random().toString(36).substring(7)}`
          });
        }, 2000);
      } else {
        // Real Razorpay integration
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <h1>Payment Test</h1>
      
      <div className="mock-toggle">
        <label>
          <input
            type="checkbox"
            checked={mockMode}
            onChange={() => setMockMode(!mockMode)}
          />
          Mock Mode (no real API calls)
        </label>
      </div>

      <div className="payment-form">
        <div className="input-group">
          <label>Amount (INR):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
          />
        </div>

        <button 
          onClick={handlePayment} 
          disabled={loading || !amount}
          className="pay-button"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>

      {orderDetails && (
        <div className="order-details">
          <h3>Order Details</h3>
          <p>Order ID: {orderDetails.orderId}</p>
          <p>Amount: ₹{orderDetails.amount}</p>
        </div>
      )}

      {paymentStatus && (
        <div className={`status-message ${paymentStatus.includes('success') ? 'success' : ''}`}>
          {paymentStatus}
        </div>
      )}

      <div className="flow-info">
        <h3>Payment Flow:</h3>
        <ol>
          <li>Enter amount and click "Pay Now"</li>
          <li>Frontend sends amount to backend</li>
          <li>Backend creates Razorpay order</li>
          <li>Frontend opens Razorpay checkout</li>
          <li>After payment, backend verifies via webhook</li>
          <li>Database status updated to "COMPLETED"</li>
        </ol>
      </div>
    </div>
  );
}

export default App;