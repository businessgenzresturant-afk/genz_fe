import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { useSession } from './SessionContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { apiClient } from '../utils/api.js';

const CartContext = createContext();

const calcTotal = (items = []) => items.reduce((sum, line) => {
  const unitPrice = line.size === 'half' ? line.halfPrice : line.fullPrice;
  return sum + unitPrice * line.quantity;
}, 0);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload || { items: [], total: 0 };
    case 'ADD_ITEM': {
      const { item, size = 'full' } = action.payload;
      const existingIndex = state.items.findIndex(
        (line) => line._id === item._id && line.size === size,
      );

      let nextItems;
      if (existingIndex >= 0) {
        nextItems = state.items.map((line, idx) => (
          idx === existingIndex ? { ...line, quantity: line.quantity + 1 } : line
        ));
      } else {
        nextItems = [
          ...state.items,
          {
            _id: item._id,
            name: item.name,
            veg: item.veg,
            halfPrice: item.halfPrice,
            fullPrice: item.fullPrice,
            size,
            quantity: 1,
          },
        ];
      }
      return { items: nextItems, total: calcTotal(nextItems) };
    }
    case 'UPDATE_QUANTITY': {
      const { _id, size, quantity } = action.payload;
      const nextItems = state.items
        .map((line) => (
          line._id === _id && line.size === size ? { ...line, quantity } : line
        ))
        .filter((line) => line.quantity > 0);
      return { items: nextItems, total: calcTotal(nextItems) };
    }
    case 'REMOVE_ITEM': {
      const { _id, size } = action.payload;
      const nextItems = state.items.filter((line) => !(line._id === _id && line.size === size));
      return { items: nextItems, total: calcTotal(nextItems) };
    }
    case 'CLEAR_CART':
      return { items: [], total: 0 };
    default:
      return state;
  }
};

const BLOCKED_FOR_ADMIN = new Set(['ADD_ITEM', 'UPDATE_QUANTITY', 'REMOVE_ITEM']);

export const CartProvider = ({ children }) => {
  const { sessionId } = useSession();
  const { isAdmin } = useAuth();
  const [storageReady, setStorageReady] = useState(false);
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  const dispatchCart = useCallback(
    (action) => {
      if (isAdmin && BLOCKED_FOR_ADMIN.has(action.type)) {
        return;
      }
      dispatch(action);
    },
    [isAdmin],
  );

  useEffect(() => {
    if (isAdmin) {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && sessionId) {
      localStorage.removeItem(`genz_cart_${sessionId}`);
    }
  }, [isAdmin, sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    let cancelled = false;
    const key = `genz_cart_${sessionId}`;

    (async () => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (!isAdmin) dispatch({ type: 'LOAD_CART', payload: parsed });
        } catch {
          if (!isAdmin) dispatch({ type: 'LOAD_CART', payload: { items: [], total: 0 } });
        }
      } else {
        try {
          const { data } = await apiClient.get(`/api/sessions/${sessionId}`);
          if (!isAdmin) {
            if (data.cart?.items?.length) {
              dispatch({ type: 'LOAD_CART', payload: data.cart });
            }
          }
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setStorageReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, isAdmin]);

  useEffect(() => {
    if (!sessionId || !storageReady || isAdmin) return;
    localStorage.setItem(`genz_cart_${sessionId}`, JSON.stringify(cart));
  }, [cart, sessionId, storageReady, isAdmin]);

  useEffect(() => {
    if (!sessionId || !storageReady || isAdmin) return undefined;
    const t = setTimeout(() => {
      apiClient.put(`/api/sessions/${sessionId}`, { cart }).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [cart, sessionId, storageReady, isAdmin]);

  return (
    <CartContext.Provider value={{ cart, dispatch: dispatchCart, storageReady }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
