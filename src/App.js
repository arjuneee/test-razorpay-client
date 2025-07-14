import React, { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [mockMode, setMockMode] = useState(true);

  // Wallet states
  const [walletAmount, setWalletAmount] = useState('');

  // Order states
  const [orderData, setOrderData] = useState({
    addressId: '',
    products: [{ productId: '', quantity: 1 }],
    paymentMethod: 'UPI',
    orderType: 'PREPAID'
  });

  const handleSetToken = (token) => {
    setToken(token);
  };

  const addProduct = () => {
    setOrderData(prev => ({
      ...prev,
      products: [...prev.products, { productId: '', quantity: 1 }]
    }));
  };

  const removeProduct = (index) => {
    setOrderData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index, field, value) => {
    setOrderData(prev => ({
      ...prev,
      products: prev.products.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const handleWalletPayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('');
      setOrderDetails(null);

      let orderResponse;
      
      if (mockMode) {
        orderResponse = {
          data: {
            orderId: `mock_order_${Math.random().toString(36).substring(7)}`,
            amount: walletAmount,
            currency: 'INR'
          }
        };
        console.log('Mock wallet order created:', orderResponse.data);
      } else {
        const response = await fetch('https://dev.api.v2.bylukz.com/v1/customer/wallet/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: parseFloat(walletAmount) || 100,
            currency: 'INR'
          })
        });
        orderResponse = { data: await response.json() };
      }

      setOrderDetails(orderResponse.data);
      console.log('Wallet order created:', orderResponse.data);

      await processRazorpayPayment(orderResponse.data, walletAmount);

    } catch (error) {
      console.error('Wallet payment error:', error);
      setPaymentStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderPayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('');
      setOrderDetails(null);

      let orderResponse;
      
      if (mockMode) {
        orderResponse = {
          data: {
            status: 'success',
            message: 'Operation completed successfully',
            data: {
              paymentOrderId: `order_mock_${Math.random().toString(36).substring(7)}`,
              amount: 1050
            }
          }
        };
        console.log('Mock order created:', orderResponse.data);
      } else {
        const response = await fetch('http://localhost:3001/v1/customer/order', {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });
        orderResponse = { data: await response.json() };
      }

      const responseData = mockMode ? orderResponse.data.data : orderResponse.data.data;
      setOrderDetails({
        orderId: responseData.paymentOrderId,
        amount: responseData.amount
      });
      console.log('Order created:', responseData);

      await processRazorpayPayment({
        orderId: responseData.paymentOrderId,
        amount: responseData.amount
      }, responseData.amount);

    } catch (error) {
      console.error('Order payment error:', error);
      setPaymentStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const processRazorpayPayment = async (orderData, amount) => {
    const options = {
      key: "rzp_test_TIWKJQDU6dYAbe",
      amount: (parseFloat(amount) * 100).toString(),
      currency: 'INR',
      name: 'E-Commerce App',
      description: activeTab === 'wallet' ? 'Wallet topup' : 'Payment for order',
      order_id: orderData.orderId,
      handler: async function(response) {
        if (mockMode) {
          console.log('Mock payment successful', response);
          setPaymentStatus(`Payment successful (mock) - ${activeTab}`);
          return;
        }
        
        try {
          setPaymentStatus(`Payment successful - ${activeTab}`);
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
      setTimeout(() => {
        options.handler({
          razorpay_payment_id: `mock_pay_${Math.random().toString(36).substring(7)}`,
          razorpay_order_id: orderData.orderId,
          razorpay_signature: `mock_sig_${Math.random().toString(36).substring(7)}`
        });
      }, 2000);
    } else {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    }
  };

  const resetStatus = () => {
    setPaymentStatus('');
    setOrderDetails(null);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Payment System</h1>
      
      {/* Common Token Input */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Token (JWT):
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => handleSetToken(e.target.value)}
          placeholder="Enter customer access token"
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      {/* Mock Mode Toggle */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={mockMode}
            onChange={() => setMockMode(!mockMode)}
          />
          Mock Mode (no real API calls)
        </label>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0' }}>
          <button
            onClick={() => { setActiveTab('wallet'); resetStatus(); }}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'wallet' ? '#3399cc' : 'transparent',
              color: activeTab === 'wallet' ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              fontWeight: 'bold'
            }}
          >
            Wallet Topup
          </button>
          <button
            onClick={() => { setActiveTab('order'); resetStatus(); }}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'order' ? '#3399cc' : 'transparent',
              color: activeTab === 'order' ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              fontWeight: 'bold'
            }}
          >
            Create Order
          </button>
        </div>
      </div>

      {/* Wallet Tab Content */}
      {activeTab === 'wallet' && (
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Wallet Topup</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Amount (INR):
            </label>
            <input
              type="number"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <button 
            onClick={handleWalletPayment} 
            disabled={loading || !walletAmount || !token}
            style={{
              padding: '12px 24px',
              backgroundColor: loading || !walletAmount || !token ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !walletAmount || !token ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Processing...' : 'Topup Wallet'}
          </button>
        </div>
      )}

      {/* Order Tab Content */}
      {activeTab === 'order' && (
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Create Order</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Address ID:
            </label>
            <input
              type="text"
              value={orderData.addressId}
              onChange={(e) => setOrderData(prev => ({ ...prev, addressId: e.target.value }))}
              placeholder="Enter address ID"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Products:
            </label>
            {orderData.products.map((product, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Product ID"
                  value={product.productId}
                  onChange={(e) => updateProduct(index, 'productId', e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={product.quantity}
                  onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                {orderData.products.length > 1 && (
                  <button
                    onClick={() => removeProduct(index)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addProduct}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Product
            </button>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Payment Method:
              </label>
              <select
                value={orderData.paymentMethod}
                onChange={(e) => setOrderData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="WALLET">WALLET</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Order Type:
              </label>
              <select
                value={orderData.orderType}
                onChange={(e) => setOrderData(prev => ({ ...prev, orderType: e.target.value }))}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="PREPAID">PREPAID</option>
                <option value="COD">COD</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleOrderPayment} 
            disabled={loading || !orderData.addressId || !token || orderData.products.some(p => !p.productId)}
            style={{
              padding: '12px 24px',
              backgroundColor: loading || !orderData.addressId || !token || orderData.products.some(p => !p.productId) ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !orderData.addressId || !token || orderData.products.some(p => !p.productId) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Processing...' : 'Create Order & Pay'}
          </button>
        </div>
      )}

      {/* Order Details */}
      {orderDetails && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          border: '1px solid #d4edda', 
          borderRadius: '8px' 
        }}>
          <h3 style={{ color: '#155724', marginBottom: '10px' }}>Order Details</h3>
          <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
          <p><strong>Amount:</strong> ₹{orderDetails.amount}</p>
        </div>
      )}

      {/* Payment Status */}
      {paymentStatus && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: paymentStatus.includes('success') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${paymentStatus.includes('success') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          color: paymentStatus.includes('success') ? '#155724' : '#721c24'
        }}>
          {paymentStatus}
        </div>
      )}

      {/* Flow Information */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>Payment Flow:</h3>
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: '#3399cc' }}>Wallet Topup:</h4>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Enter amount and click "Topup Wallet"</li>
              <li>Frontend sends amount to wallet API</li>
              <li>Backend creates Razorpay order</li>
              <li>Frontend opens Razorpay checkout</li>
              <li>After payment, wallet balance updated</li>
            </ol>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: '#007bff' }}>Order Creation:</h4>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Fill order details and click "Create Order & Pay"</li>
              <li>Frontend sends order data to order API</li>
              <li>Backend creates order and Razorpay payment</li>
              <li>Frontend opens Razorpay checkout</li>
              <li>After payment, order status updated</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;