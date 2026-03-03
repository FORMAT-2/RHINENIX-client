import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    const { data } = await api.post('/cart/items', { productId, quantity });
    setCart(data.data);
    return data.data;
  };

  const updateItem = async (productId, quantity) => {
    const { data } = await api.patch(`/cart/items/${productId}`, { quantity });
    setCart(data.data);
    return data.data;
  };

  const removeItem = async (productId) => {
    const { data } = await api.delete(`/cart/items/${productId}`);
    setCart(data.data);
    return data.data;
  };

  const clearCart = async () => {
    await api.delete('/cart');
    setCart(null);
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addItem, updateItem, removeItem, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}
