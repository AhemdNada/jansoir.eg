import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../api/orderApi';
import { settingsApi } from '../api/settingsApi';
import { shippingApi } from '../api/shippingApi';
import { couponApi } from '../api/couponApi';
import GovernorateSelect from '../components/common/GovernorateSelect';
import { getGovernorateLabel } from '../localization/governorates';
import { computeTotals } from '../utils/pricing';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faMinus, faShoppingBag, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { trackEvent, trackPageView } from '../analytics/analyticsClient';

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { applyLocalStockAdjustments, fetchProducts, ensureFreshProducts } = useProducts();
  const [showCheckout, setShowCheckout] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [settings, setSettings] = useState(null);
  const [settingsError, setSettingsError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null);
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [shippingList, setShippingList] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [shippingGovernorateId, setShippingGovernorateId] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { coupon, discountAmount }

  const subtotal = getCartTotal();
  const shippingPrice = shippingGovernorateId
    ? Number(shippingList.find((g) => g._id === shippingGovernorateId)?.shippingPrice || 0)
    : 0;
  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const totals = computeTotals({ subtotal, shippingPrice, discountAmount });
  const itemsCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  // Lock background scroll when checkout is open
  useEffect(() => {
    if (showCheckout) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showCheckout]);

  // ESC to close checkout
  useEffect(() => {
    if (!showCheckout) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setShowCheckout(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showCheckout]);

  // Load payment & shipping settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await settingsApi.getPaymentShipping();
        setSettings(res);
        setSettingsError('');
      } catch (err) {
        setSettingsError(err.message || 'Failed to load settings');
      }
    };
    loadSettings();
  }, []);

  const loadShipping = useCallback(async () => {
    try {
      setShippingLoading(true);
      setShippingError('');
      const list = await shippingApi.getAll();
      setShippingList(list);
    } catch (e) {
      setShippingError(e.message || 'Failed to load shipping');
    } finally {
      setShippingLoading(false);
    }
  }, []);

  // Load shipping options when checkout opens
  useEffect(() => {
    if (!showCheckout) return;
    loadShipping();
  }, [showCheckout, loadShipping]);

  const enabledPaymentMethods = () => {
    if (!settings) return [];
    const methods = [];
    if (settings.cashOnDeliveryEnabled) methods.push({ id: 'cash_on_delivery', label: 'Cash on Delivery', note: 'Pay with cash upon delivery.', number: null });
    if (settings.vodafoneCashEnabled) methods.push({ id: 'vodafone_cash', label: 'Vodafone Cash', note: `Wallet: ${settings.vodafoneCashNumber || 'Not provided'}`, number: settings.vodafoneCashNumber || null });
    if (settings.instapayEnabled) methods.push({ id: 'instapay', label: 'Instapay', note: `Instapay: ${settings.instapayNumber || 'Not provided'}`, number: settings.instapayNumber || null });
    return methods;
  };

  const copyToClipboard = async (text, methodId) => {
    if (!text || text === 'Not provided') return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNumber(methodId);
      setTimeout(() => setCopiedNumber(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const requiresReceipt = paymentMethod === 'vodafone_cash' || paymentMethod === 'instapay';

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-dark-base py-12 sm:py-16 lg:py-20 mt-[110px] sm:mt-[120px] lg:mt-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-dark-light border border-woody rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faShoppingBag} className="text-5xl sm:text-6xl text-woody" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gold mb-4">
            Your cart is empty
          </h1>
          <p className="text-beige text-sm sm:text-base mb-8 max-w-md mx-auto">
            Start shopping to add items to your cart and enjoy our amazing products
          </p>
          <Link to="/products">
            <button className="bg-dark-light text-beige border-2 border-gold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg hover:bg-gold hover:text-dark-base hover:border-gold transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const validateCheckout = () => {
    const errs = {};
    if (!/^\d{11}$/.test(phone)) {
      errs.phone = 'Phone must be exactly 11 digits';
    }
    if (!address.trim()) {
      errs.address = 'Address is required';
    }
    if (!shippingGovernorateId) {
      errs.shippingGovernorate = 'Please select a governorate for shipping';
    }
    if (!paymentMethod) {
      errs.paymentMethod = 'Please select a payment method';
    }
    if (requiresReceipt && !paymentReceiptFile) {
      errs.paymentReceipt = 'Payment receipt is required for this method';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceed = async () => {
    // Make sure cart-facing data is fresh before showing checkout
    await ensureFreshProducts();
    await fetchProducts();
    if (!isAuthenticated()) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (settingsError || !settings) {
      setSubmitMessage(settingsError || 'Payment & shipping settings are not loaded yet. Please try again.');
      return;
    }
    setShowCheckout(true);
    // Ensure /cart page_view is recorded before checkout_start (ordering correctness).
    await trackPageView(location);
    trackEvent('checkout_start', {
      itemsCount,
      subtotal,
      items: cart.items.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
        price: it.price,
        size: it.size || '',
        color: it.color || ''
      }))
    });
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponError('Please enter a coupon code');
      setAppliedCoupon(null);
      return;
    }
    try {
      setCouponApplying(true);
      setCouponError('');
      const data = await couponApi.validate({ code, subtotal });
      setAppliedCoupon({ coupon: data.coupon, discountAmount: data.discountAmount });
    } catch (e) {
      setAppliedCoupon(null);
      setCouponError(e.message || 'Invalid coupon');
    } finally {
      setCouponApplying(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (submitting) return;
    if (!validateCheckout()) return;
    try {
      setSubmitting(true);
      setSubmitMessage('');
      setCouponError('');
      // Ensure latest catalog & settings before placing order
      await ensureFreshProducts();
      const latestSettings = await settingsApi.getPaymentShipping();
      setSettings(latestSettings);
      setSettingsError('');

      // Ensure latest shipping/coupon before placing order (defensive against stale admin changes)
      const latestShipping = await shippingApi.getAll();
      setShippingList(latestShipping);
      let latestAppliedCoupon = appliedCoupon;
      const normalizedCode = couponCode.trim();
      if (normalizedCode) {
        try {
          const data = await couponApi.validate({ code: normalizedCode, subtotal });
          latestAppliedCoupon = { coupon: data.coupon, discountAmount: data.discountAmount };
          setAppliedCoupon(latestAppliedCoupon);
        } catch (e) {
          latestAppliedCoupon = null;
          setAppliedCoupon(null);
          setCouponError(e.message || 'Invalid coupon');
          // do not block ordering; allow user to proceed without coupon if they want
        }
      }

      const orderPayload = {
        items: cart.items.map(it => ({
          productId: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
          category: it.category,
          size: it.size || '',
          color: it.color || ''
        })),
        phone,
        address,
        subtotal, // kept for backward compatibility; backend recomputes authoritatively
        shippingGovernorateId,
        couponCode: latestAppliedCoupon?.coupon?.code || '',
        paymentMethod,
        paymentReceiptFile
      };
      const created = await orderApi.createOrder(token, orderPayload);
      trackEvent('order_success', {
        orderId: created?.data?._id || '',
        value: totals.totalWithShipping,
        paymentMethod,
        itemsCount
      });
      // Optimistic UI update
      applyLocalStockAdjustments(orderPayload.items);
      // Re-fetch to align with DB
      fetchProducts();
      clearCart();
      setSubmitMessage('Order placed successfully!');
      setShowCheckout(false);
      navigate('/orders/confirmation', { state: { message: 'Order placed successfully' } });
    } catch (err) {
      const msg = err?.message || 'Failed to place order';
      trackEvent('order_failed', { message: msg });
      setSubmitMessage(
        msg.includes('out of stock') || msg.includes('Quantity exceeds')
          ? 'One or more items in your cart are no longer available in the requested quantity.'
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-dark-base py-6 sm:py-8 lg:py-12 mt-[110px] sm:mt-[120px] lg:mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gold mb-2">
            Shopping Cart
          </h1>
          <p className="text-beige text-sm sm:text-base">
            {itemsCount} {itemsCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-dark-light border border-woody rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              {/* Cart Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-woody">
                <h2 className="text-lg sm:text-xl font-semibold text-gold mb-2 sm:mb-0">
                  Cart Items ({itemsCount})
                </h2>
                <button
                  onClick={clearCart}
                  className="text-sm sm:text-base text-brand hover:text-brand-strong font-semibold transition-colors duration-200 flex items-center gap-2 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs sm:text-sm" />
                  <span>Clear Cart</span>
                </button>
              </div>
              
              {/* Cart Items List */}
              <div className="space-y-4 sm:space-y-6">
                {cart.items.map((item, index) => (
                  <div 
                    key={`${item.id}-${item.size || ''}-${item.color || ''}`}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-4 sm:pb-6 ${
                      index !== cart.items.length - 1 ? 'border-b border-woody' : ''
                    }`}
                  >
                    {/* Product Image + Info - clickable to details */}
                    <Link
                      to={`/product/${item.id}`}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0 group cursor-pointer"
                    >
                      <div className="w-full sm:w-24 h-48 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-dark-base border border-woody group-hover:border-gold transition-colors">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 w-full sm:w-auto min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-beige mb-1 sm:mb-2 group-hover:text-gold transition-colors">
                          {item.name}
                        </h3>
                      <p className="text-sm sm:text-base text-gold mb-1 sm:mb-0">
                        {item.price.toFixed(2)} EGP per item
                      </p>
                      {(item.size || item.color) && (
                        <p className="text-xs text-gold mb-2 sm:mb-0">
                          {item.size ? `Size: ${item.size}` : ''} {item.color ? `Color: ${item.color}` : ''}
                        </p>
                      )}
                      
                      {/* Mobile: Quantity and Price */}
                      <div className="sm:hidden flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.id, item.quantity - 1, item.size, item.color); }}
                            className="w-8 h-8 rounded-lg border-2 border-gold bg-dark-light text-beige flex items-center justify-center hover:bg-gold hover:text-dark-base hover:border-gold transition-all duration-300 font-semibold focus:outline-none"
                          >
                            <FontAwesomeIcon icon={faMinus} className="text-xs" />
                          </button>
                          <span className="w-10 text-center font-bold text-lg text-gold">{item.quantity}</span>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.id, item.quantity + 1, item.size, item.color); }}
                            className="w-8 h-8 rounded-lg border-2 border-gold bg-dark-light text-beige flex items-center justify-center hover:bg-gold hover:text-dark-base hover:border-gold transition-all duration-300 font-semibold focus:outline-none"
                          >
                            <FontAwesomeIcon icon={faPlus} className="text-xs" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-base text-gold">
                            {(item.price * item.quantity).toFixed(2)} EGP
                          </p>
                        </div>
                      </div>
                      </div>
                    </Link>
                    
                    {/* Desktop: Quantity Controls */}
                    <div className="hidden sm:flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                        className="w-10 h-10 rounded-lg border-2 border-gold bg-dark-light text-beige flex items-center justify-center hover:bg-gold hover:text-dark-base hover:border-gold transition-all duration-300 font-semibold focus:outline-none"
                      >
                        <FontAwesomeIcon icon={faMinus} className="text-sm" />
                      </button>
                      <span className="w-12 text-center font-bold text-lg text-gold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                        className="w-10 h-10 rounded-lg border-2 border-gold bg-dark-light text-beige flex items-center justify-center hover:bg-gold hover:text-dark-base hover:border-gold transition-all duration-300 font-semibold focus:outline-none"
                      >
                        <FontAwesomeIcon icon={faPlus} className="text-sm" />
                      </button>
                    </div>
                    
                    {/* Desktop: Price and Remove */}
                    <div className="hidden sm:block text-right min-w-[120px]">
                      <p className="font-bold text-lg text-gold mb-2">
                        {(item.price * item.quantity).toFixed(2)} EGP
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id, item.size, item.color)}
                        className="text-sm text-brand hover:text-brand-strong font-medium transition-colors duration-200 flex items-center gap-1 justify-end focus:outline-none"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        <span>Remove</span>
                      </button>
                    </div>
                    
                    {/* Mobile: Remove Button */}
                    <div className="sm:hidden w-full">
                      <button
                        onClick={() => removeFromCart(item.id, item.size, item.color)}
                        className="w-full text-sm text-brand font-medium transition-colors duration-200 flex items-center gap-2 justify-center py-2 border border-brand rounded-lg hover:bg-brand hover:text-brand-contrast focus:outline-none"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        <span>Remove Item</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-dark-light border border-woody rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 sticky top-24 lg:top-28">
              <h2 className="text-lg sm:text-xl font-semibold text-gold mb-6 pb-4 border-b border-woody">
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-beige text-sm sm:text-base">Subtotal</span>
                  <span className="font-bold text-gold text-base sm:text-lg">{subtotal.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-beige text-sm sm:text-base">Shipping</span>
                  <span className="font-bold text-gold text-base sm:text-lg">Calculated at checkout</span>
                </div>
                <div className="border-t-2 border-woody pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-gold">Total</span>
                    <span className="text-lg sm:text-xl font-bold text-gold">{subtotal.toFixed(2)} EGP</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleProceed}
                  className="w-full bg-gold text-dark-base border-2 border-gold px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg hover:bg-gold-light hover:text-dark-base hover:border-gold transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none"
                >
                  Proceed to Checkout
                </button>
                
                <Link to="/products" className="block">
                  <button className="w-full bg-dark-light text-beige border-2 border-gold px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg hover:bg-gold hover:text-dark-base hover:border-gold transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none">
                    Continue Shopping
                  </button>
                </Link>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t border-woody">
                <div className="flex items-start gap-2 text-xs sm:text-sm text-woody">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Shipping is calculated at checkout based on your selected governorate.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {showCheckout && (
      <div
        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center px-3 sm:px-4 py-4 sm:py-8"
        onClick={() => setShowCheckout(false)}
      >
        <div
          className="bg-dark-light border border-woody rounded-xl sm:rounded-2xl w-full max-w-3xl sm:max-w-4xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-woody bg-dark-light sticky top-0 z-10">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-woody font-semibold">Checkout</p>
              <h3 className="text-xl font-bold text-gold">Order Details</h3>
            </div>
            <button
              onClick={() => setShowCheckout(false)}
              className="text-woody hover:text-gold w-9 h-9 rounded-full flex items-center justify-center hover:bg-dark-base transition"
              aria-label="Close checkout"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 lg:gap-6 px-4 sm:px-6 py-5 overflow-y-auto">
            {/* Left: Form */}
            <div className="space-y-5">
              <div className="rounded-xl border border-woody p-4 shadow-sm bg-dark-base">
                <h4 className="text-sm font-semibold text-gold mb-3">Contact & Delivery</h4>
                <div className="space-y-3">
            <div>
                    <label className="block text-xs font-semibold text-beige mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                maxLength={11}
                      className="w-full px-3 py-2.5 border border-woody rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold bg-black text-gold placeholder-woody"
                placeholder="11-digit phone"
              />
              {errors.phone && <p className="text-gold text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
                    <label className="block text-xs font-semibold text-beige mb-1">Address</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={3}
                      className="w-full px-3 py-2.5 border border-woody rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold bg-black text-gold placeholder-woody"
                placeholder="Delivery address"
              />
              {errors.address && <p className="text-gold text-xs mt-1">{errors.address}</p>}
            </div>
            <div>
                    <GovernorateSelect
                      label="المحافظة"
                      value={shippingGovernorateId}
                      onChange={setShippingGovernorateId}
                      disabled={shippingLoading}
                      error={errors.shippingGovernorate || shippingError || ''}
                      onRefresh={loadShipping}
                      refreshDisabled={shippingLoading}
                      options={shippingList.map((g) => ({
                        value: g._id,
                        label: getGovernorateLabel(g),
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-woody p-4 shadow-sm bg-dark-base">
                <h4 className="text-sm font-semibold text-gold mb-3">Payment Method</h4>
              {enabledPaymentMethods().length === 0 && (
                <p className="text-sm text-gold">No payment methods are available. Please contact the store.</p>
              )}
              <div className="space-y-2">
                {enabledPaymentMethods().map(method => (
                    <label
                      key={method.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                        paymentMethod === method.id ? 'border-gold bg-gold/10' : 'border-woody hover:border-gold'
                      }`}
                    >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 accent-gold"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-beige text-sm">{method.label}</p>
                      {method.number ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gold">
                            {method.id === 'vodafone_cash' ? 'Wallet: ' : 'Instapay: '}
                            {method.number}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(method.number, method.id);
                            }}
                            className="p-1 hover:bg-gold/20 rounded transition-colors focus:outline-none"
                            title="Copy number"
                          >
                            <FontAwesomeIcon
                              icon={copiedNumber === method.id ? faCheck : faCopy}
                              className={`text-xs ${copiedNumber === method.id ? 'text-gold' : 'text-gold/70 hover:text-gold'}`}
                            />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gold">{method.note}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {errors.paymentMethod && <p className="text-gold text-xs mt-1">{errors.paymentMethod}</p>}
            </div>

            {requiresReceipt && (
                <div className="rounded-xl border border-woody p-4 shadow-sm bg-dark-base">
                  <h4 className="text-sm font-semibold text-gold mb-3">Payment Receipt</h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentReceiptFile(e.target.files[0] || null)}
                  className="w-full text-sm text-beige"
                />
                <p className="text-xs text-woody mt-1">Image formats up to 5MB.</p>
                {errors.paymentReceipt && <p className="text-gold text-xs mt-1">{errors.paymentReceipt}</p>}
              </div>
            )}
            </div>

            {/* Right: Summary */}
            <div className="rounded-2xl border border-woody shadow-md p-4 sm:p-5 bg-dark-light space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gold">Order Summary</h4>
                <span className="text-xs font-semibold px-2 py-1 bg-dark-base border border-woody rounded-full text-beige">
                  {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-beige">Subtotal</span>
                  <span className="font-bold text-gold">{subtotal.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-beige">Shipping</span>
                  <span className="font-bold text-gold">{shippingPrice.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-beige">Discount</span>
                  <span className="font-bold text-gold">-{totals.discountAmount.toFixed(2)} EGP</span>
                </div>
                <div className="border-t border-woody pt-3 flex justify-between items-center">
                  <span className="text-base font-bold text-gold">Total</span>
                  <span className="text-lg font-bold text-gold">{totals.totalWithShipping.toFixed(2)} EGP</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="rounded-xl border border-woody p-3 bg-dark-base space-y-2">
                <p className="text-xs font-semibold text-beige">Coupon Code</p>
                <div className="flex items-center gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-woody bg-black text-gold placeholder-woody"
                    placeholder="Enter coupon…"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponApplying}
                    className="px-3 py-2 rounded-lg bg-gold text-dark-base font-semibold border border-gold disabled:opacity-50"
                  >
                    {couponApplying ? 'Applying…' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon?.coupon?.code && (
                  <p className="text-xs text-gold">
                    Applied: <span className="font-semibold">{appliedCoupon.coupon.code}</span>{' '}
                    <span className="text-woody-light">
                      ({appliedCoupon.coupon.type === 'fixed'
                        ? `${Number(appliedCoupon.coupon.value).toFixed(2)} EGP`
                        : `${Number(appliedCoupon.coupon.value)}%`})
                    </span>
                  </p>
                )}
                {couponError && <p className="text-xs text-gold">{couponError}</p>}
              </div>

              {submitMessage && (
                <div className={`px-4 py-3 rounded-lg text-sm ${submitMessage.includes('success') ? 'bg-gold/20 text-gold border border-gold' : 'bg-woody/30 text-gold border border-gold'}`}>
                {submitMessage}
              </div>
            )}

              <div className="space-y-2">
            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
                  className="w-full bg-gold text-dark-base px-4 py-3 rounded-lg font-semibold hover:bg-gold-light hover:text-dark-base transition disabled:opacity-50 shadow-md border border-gold"
            >
              {submitting ? 'Placing order...' : 'Confirm and Place Order'}
            </button>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full bg-dark-base text-beige border border-woody px-4 py-3 rounded-lg font-semibold hover:border-gold hover:text-gold transition"
                >
                  Cancel
                </button>
              </div>

              <div className="text-xs text-woody bg-dark-base border border-woody rounded-lg p-3">
                Shipping is calculated based on your selected governorate.
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Cart;