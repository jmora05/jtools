// src/shared/context/CartContext.tsx
import React, { createContext, useReducer, useCallback } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface CartItem {
    id: number;
    nombreProducto: string;
    referencia: string;
    precio: number;
    imagenUrl?: string | null;
    cantidad: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
}

type CartAction =
    | { type: 'ADD_ITEM';    payload: Omit<CartItem, 'cantidad'> }
    | { type: 'REMOVE_ITEM'; payload: { id: number } }
    | { type: 'UPDATE_QTY';  payload: { id: number; cantidad: number } }
    | { type: 'CLEAR_CART' }
    | { type: 'OPEN_CART' }
    | { type: 'CLOSE_CART' };

export interface CartContextValue {
    items:       CartItem[];
    isOpen:      boolean;
    totalItems:  number;
    totalPrice:  number;
    addItem:     (product: Omit<CartItem, 'cantidad'>) => void;
    removeItem:  (id: number) => void;
    updateQty:   (id: number, cantidad: number) => void;
    clearCart:   () => void;
    openCart:    () => void;
    closeCart:   () => void;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {

        case 'ADD_ITEM': {
            const exists = state.items.find(i => i.id === action.payload.id);
            if (exists) {
                // Si ya está en el carrito, suma 1
                return {
                    ...state,
                    isOpen: true,
                    items: state.items.map(i =>
                        i.id === action.payload.id
                            ? { ...i, cantidad: i.cantidad + 1 }
                            : i
                    ),
                };
            }
            return {
                ...state,
                isOpen: true,
                items: [...state.items, { ...action.payload, cantidad: 1 }],
            };
        }

        case 'REMOVE_ITEM':
            return {
                ...state,
                items: state.items.filter(i => i.id !== action.payload.id),
            };

        case 'UPDATE_QTY':
            if (action.payload.cantidad < 1) {
                return {
                    ...state,
                    items: state.items.filter(i => i.id !== action.payload.id),
                };
            }
            return {
                ...state,
                items: state.items.map(i =>
                    i.id === action.payload.id
                        ? { ...i, cantidad: action.payload.cantidad }
                        : i
                ),
            };

        case 'CLEAR_CART':
            return { ...state, items: [] };

        case 'OPEN_CART':
            return { ...state, isOpen: true };

        case 'CLOSE_CART':
            return { ...state, isOpen: false };

        default:
            return state;
    }
}

// ─── Context ──────────────────────────────────────────────────────────────────
export const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

    const addItem    = useCallback((product: Omit<CartItem, 'cantidad'>) => dispatch({ type: 'ADD_ITEM',    payload: product }),          []);
    const removeItem = useCallback((id: number)                           => dispatch({ type: 'REMOVE_ITEM', payload: { id } }),           []);
    const updateQty  = useCallback((id: number, cantidad: number)         => dispatch({ type: 'UPDATE_QTY',  payload: { id, cantidad } }), []);
    const clearCart  = useCallback(()                                     => dispatch({ type: 'CLEAR_CART' }),                             []);
    const openCart   = useCallback(()                                     => dispatch({ type: 'OPEN_CART' }),                              []);
    const closeCart  = useCallback(()                                     => dispatch({ type: 'CLOSE_CART' }),                             []);

    const totalItems = state.items.reduce((acc, i) => acc + i.cantidad, 0);
    const totalPrice = state.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

    return (
        <CartContext.Provider value={{
            items:      state.items,
            isOpen:     state.isOpen,
            totalItems,
            totalPrice,
            addItem,
            removeItem,
            updateQty,
            clearCart,
            openCart,
            closeCart,
        }}>
            {children}
        </CartContext.Provider>
    );
}
