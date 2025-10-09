import { useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';
import { ProductProvider } from '../Context/ProductContext';
import { CartProvider } from '../Context/CartContext';
import { UserProvider } from '../Context/UserContext';
import { CategoryProvider } from '../Context/CategoryContext';
import { DiscountProvider } from '../Context/DiscountContext';
import { BannerProvider } from '../Context/BannerContext';
import { AnnouncementProvider } from '../Context/AnnouncementContext';
import { FreeCashProvider } from '../Context/FreeCashContext';
import { CompanySettingsProvider } from '../Context/CompanySettingsContext';

const ConditionalProvider = ({children}) => {
    const { user } = useContext(AuthContext);

    if(user?.role === "admin") {
        return(
                <ProductProvider>
                    <FreeCashProvider>
                        <UserProvider>
                            <CategoryProvider>
                                <BannerProvider>
                                    {children}
                                </BannerProvider>
                            </CategoryProvider>
                        </UserProvider>
                    </FreeCashProvider>
                </ProductProvider>
        );
    }

    // For logged-in users and guests - load all public contexts
    return (
        <CompanySettingsProvider>
            <ProductProvider>
                <FreeCashProvider>
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
                </FreeCashProvider>
            </ProductProvider>
        </CompanySettingsProvider>
    );
};

export default ConditionalProvider;