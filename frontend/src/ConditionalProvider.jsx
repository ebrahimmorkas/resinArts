import { useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';
import { ProductProvider } from '../Context/ProductContext';
import { CartProvider } from '../Context/CartContext';
import { UserProvider } from '../Context/UserContext';
import { CategoryProvider } from '../Context/CategoryContext';
// import User from '../../backend/models/User';

const ConditionalProvider = ({children}) => {
    const { user } = useContext(AuthContext);

    if(user?.role === "admin") {
        return(
            <ProductProvider>
                <UserProvider>
                    <CategoryProvider>
                    {children}
                    </CategoryProvider>
                </UserProvider>
            </ProductProvider>
        );
    }

    return (
        <ProductProvider>
            <CartProvider>
                <CategoryProvider>
                {children}
                </CategoryProvider>
            </CartProvider>
        </ProductProvider>
    )
};

export default ConditionalProvider;