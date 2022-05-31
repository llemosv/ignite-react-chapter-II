import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      
      const { data: prod } = await api.get<Product>(`/products/${productId}`);
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      const existsProduct = cart.filter((prod: Product) => prod.id === productId);

      if (existsProduct.length >= 1) {
        if (existsProduct[0].amount + 1 > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      }

      if (existsProduct.length >= 1) {
        const newCart = cart.map(prod => {
          if (prod.id === existsProduct[0].id) {
            prod.amount = prod.amount + 1;
          }
          return prod;
        })
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      }
      else {
        prod.amount = 1;
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, prod]));
        setCart([...cart, prod]);
      }
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO

      const newCart = [...cart];
      const prodIndex = newCart.findIndex(prod => prod.id === productId)

      if (prodIndex >= 0) {
        newCart.splice(prodIndex, 1);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      } else {
        throw Error();
      }

    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount<= 0) return;

      const stock = await api.get<Stock>(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if(amount > stockAmount){
        return toast.error('Quantidade solicitada fora de estoque');
      } 

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId)
      if (productExists){
        setCart(updatedCart);
        productExists.amount = amount;
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else{
        throw Error();
      }
    } catch {
      return toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
