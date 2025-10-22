import { useContext, useMemo } from 'react';
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
import { FavoritesProvider } from '../Context/FavoritesContext';

const ConditionalProvider = ({children}) => {
    const { user, loading } = useContext(AuthContext);

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 text-lg font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // Memoize providers to prevent unnecessary re-renders
    const adminProviders = useMemo(() => (
        <CompanySettingsProvider>
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
        </CompanySettingsProvider>
    ), [children]);

    const publicProviders = useMemo(() => (
        <CompanySettingsProvider>
            <ProductProvider>
                <CategoryProvider>
                    <BannerProvider>
                        <DiscountProvider>
                            <AnnouncementProvider>
                                <FreeCashProvider>
                                    <CartProvider>
                                        <FavoritesProvider>
                                            {children}
                                        </FavoritesProvider>
                                    </CartProvider>
                                </FreeCashProvider>
                            </AnnouncementProvider>
                        </DiscountProvider>
                    </BannerProvider>
                </CategoryProvider>
            </ProductProvider>
        </CompanySettingsProvider>
    ), [children]);

    if (user?.role === "admin") {
        return adminProviders;
    }

    return publicProviders;
};

export default ConditionalProvider;