import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  cart: [],
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(item => item.product_id === product.id)
    if (existing) {
      return {
        cart: state.cart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.price }
            : item
        )
      }
    }
    return {
      cart: [...state.cart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total_price: product.price
      }]
    }
  }),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.product_id !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: Number(quantity), total_price: Number(quantity) * item.price }
        : item
    )
  })),
  clearCart: () => set({ cart: [] }),
  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + item.total_price, 0);
  }
}))
