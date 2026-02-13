// src/context/CartContext.jsx
import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartApi } from '../api/cartApi';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload || [] };
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(item =>
        item.id === action.payload.id &&
        item.size === action.payload.size &&
        item.color === action.payload.color
      );
      const maxStock = action.payload.variantStock ?? action.payload.availableStock ?? Infinity;
      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + 1, maxStock);
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id &&
            item.size === action.payload.size &&
            item.color === action.payload.color
              ? { ...item, quantity: newQty }
              : item
          )
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1, variantStock: maxStock }]
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id ||
          item.size !== action.payload.size || item.color !== action.payload.color)
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item => {
          if (
            item.id === action.payload.id &&
            item.size === action.payload.size &&
            item.color === action.payload.color
          ) {
            const maxStock = item.variantStock ?? item.availableStock ?? Infinity;
            const nextQty = Math.max(1, Math.min(action.payload.quantity, maxStock));
            return { ...item, quantity: nextQty };
          }
          return item;
        })
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    default:
      return state;
  }
};

const initialState = {
  items: []
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, token, user } = useAuth();
  const prevAuthRef = useRef(isAuthenticated());

  // Guest cart storage helpers
  const GUEST_KEY = 'guest_cart_v1';
  const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  const getKey = (item) => `${item.id || item.product}|${item.size || ''}|${item.color || ''}`;

  const loadGuestCart = () => {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.expiresAt || Date.now() > parsed.expiresAt) {
        localStorage.removeItem(GUEST_KEY);
        return null;
      }
      return Array.isArray(parsed.items) ? parsed.items : null;
    } catch (err) {
      console.error('Failed to parse guest cart:', err);
      localStorage.removeItem(GUEST_KEY);
      return null;
    }
  };

  const persistGuestCart = (items) => {
    const now = Date.now();
    const payload = {
      items,
      createdAt: now,
      expiresAt: now + TTL_MS,
    };
    localStorage.setItem(GUEST_KEY, JSON.stringify(payload));
  };

  // Sync to backend (full replace)
  const syncServerCart = useCallback(async (items) => {
    if (!token) return;
    try {
      await cartApi.replaceCart(items, token);
    } catch (err) {
      console.error('Failed to sync cart', err);
    }
  }, [token]);

  // Hydrate on mount / auth change
  useEffect(() => {
    const hydrate = async () => {
      if (isAuthenticated()) {
        try {
          const serverItems = await cartApi.getCart(token);
          dispatch({ type: 'SET_CART', payload: serverItems });
        } catch (err) {
          console.error('Failed to hydrate cart from server', err);
          dispatch({ type: 'SET_CART', payload: [] });
        }
      } else {
        const guestItems = loadGuestCart();
        dispatch({ type: 'SET_CART', payload: guestItems || [] });
      }
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated(), token]);

  // Merge guest cart into server cart on login/register
  useEffect(() => {
    const prev = prevAuthRef.current;
    const now = isAuthenticated();
    if (!prev && now) {
      const merge = async () => {
        const guestItems = loadGuestCart() || [];
        try {
          const serverItems = await cartApi.getCart(token);
          const map = new Map();
          const addAll = (items) => {
            items.forEach(it => {
              const key = getKey(it);
              const existing = map.get(key);
              const maxStock = it.variantStock ?? it.availableStock ?? Infinity;
              if (existing) {
                const mergedQty = Math.min((existing.quantity || 0) + (it.quantity || 0), maxStock);
                map.set(key, { ...existing, quantity: mergedQty });
              } else {
                map.set(key, { ...it, quantity: Math.max(1, Math.min(it.quantity || 1, maxStock)) });
              }
            });
          };
          addAll(serverItems);
          addAll(guestItems);
          const merged = Array.from(map.values());
          await cartApi.replaceCart(merged, token);
          dispatch({ type: 'SET_CART', payload: merged });
          localStorage.removeItem(GUEST_KEY);
        } catch (err) {
          console.error('Failed to merge guest cart on login', err);
        }
      };
      merge();
    }
    // On logout: clear guest cart (server already has the cart, no need to persist)
    if (prev && !now) {
      localStorage.removeItem(GUEST_KEY);
    }
    prevAuthRef.current = now;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated(), token, user, state.items]);

  const addToCart = (product) => {
    const nextState = cartReducer(state, { type: 'ADD_TO_CART', payload: product });
    dispatch({ type: 'ADD_TO_CART', payload: product });
    if (isAuthenticated()) {
      syncServerCart(nextState.items);
    } else {
      persistGuestCart(nextState.items);
    }
  };

  const removeFromCart = (productId, size, color) => {
    const nextState = cartReducer(state, { type: 'REMOVE_FROM_CART', payload: { id: productId, size, color } });
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id: productId, size, color } });
    if (isAuthenticated()) {
      syncServerCart(nextState.items);
    } else {
      persistGuestCart(nextState.items);
    }
  };

  const updateQuantity = (productId, quantity, size, color) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
    } else {
      const nextState = cartReducer(state, { type: 'UPDATE_QUANTITY', payload: { id: productId, quantity, size, color } });
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity, size, color } });
      if (isAuthenticated()) {
        syncServerCart(nextState.items);
      } else {
        persistGuestCart(nextState.items);
      }
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    if (isAuthenticated()) {
      syncServerCart([]);
    } else {
      persistGuestCart([]);
    }
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart: state,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

