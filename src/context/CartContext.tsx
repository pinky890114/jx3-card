import { createContext, useContext, useState, ReactNode } from "react";

export interface Card {
  id: string;
  series: number;
  rarity: string;
  name: string;
  image_url: string;
  stock: number;
}

interface CartContextType {
  cart: Card[];
  addToCart: (card: Card) => void;
  removeFromCart: (cardId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Card[]>([]);

  const addToCart = (card: Card) => {
    setCart((prev) => {
      if (prev.find((c) => c.id === card.id)) return prev;
      return [...prev, card];
    });
  };

  const removeFromCart = (cardId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cardId));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
