import { useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';
import { ProductProvider } from '../Context/ProductContext';
import { CartProvider } from '../Context/CartContext';
import { UserProvider } from '../Context/UserContext';
import { CategoryProvider } from '../Context/CategoryContext';
import { DiscountProvider } from '../Context/DiscountContext';
import { BannerProvider } from '../Context/BannerContext';
import { AnnouncementProvider } from '../Context/AnnouncementContext';
// import User from '../../backend/models/User';

const ConditionalProvider = ({children}) => {
    const { user } = useContext(AuthContext);

    if(user?.role === "admin") {
        return(
            <ProductProvider>
                <UserProvider>
                    <CategoryProvider>
                        <BannerProvider>
                    {children}
                        </BannerProvider>
                    </CategoryProvider>
                </UserProvider>
            </ProductProvider>
        );
    }

    return (
        <ProductProvider>
            <AnnouncementProvider>
            <BannerProvider>
                <DiscountProvider>
            <CartProvider>
                <CategoryProvider>
                {children}
                </CategoryProvider>
            </CartProvider>
            </DiscountProvider>
            </BannerProvider>
            </AnnouncementProvider>
        </ProductProvider>
    )
};

export default ConditionalProvider;