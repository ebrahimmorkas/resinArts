import axios from 'axios';
import React, { createContext, useEffect, useState, useMemo } from 'react';

export const DiscountContext = createContext();

export const DiscountProvider = ({children}) => {
    const [discountData, setDiscountData] = useState([]);
    const [loadingDiscount, setLoadingDiscount] = useState(true);
    const [loadingErrors, setLoadingErrors] = useState([]);
    const [isDiscountAvailable, setIsDiscountAvailable] = useState(false);

    useEffect(() => {
        const checkForDiscounts = async () => {
            try {
                // Check cache first
                const cachedData = sessionStorage.getItem('discountsCache');
                const cacheTimestamp = sessionStorage.getItem('discountsCacheTime');
                
                if (cachedData && cacheTimestamp) {
                    const now = Date.now();
                    const cacheAge = now - parseInt(cacheTimestamp);
                    
                    // Use cache if less than 5 minutes old
                    if (cacheAge < 300000) {
                        const parsedData = JSON.parse(cachedData);
                        setDiscountData(parsedData);
                        setIsDiscountAvailable(parsedData.length > 0);
                        setLoadingDiscount(false);
                        return;
                    }
                }

                const res = await axios.get('http://localhost:3000/api/discount/fetch-discount', {
                    withCredentials: true
                });
               
                if(res.status === 200) {
                    const discounts = res.data.data || [];
                    setDiscountData(discounts);
                    setIsDiscountAvailable(discounts.length > 0);
                    
                    // Cache the data
                    sessionStorage.setItem('discountsCache', JSON.stringify(discounts));
                    sessionStorage.setItem('discountsCacheTime', Date.now().toString());
                }
            } catch(error) {
                console.log(error);
                setLoadingErrors(prev =>
                    prev.includes(error.message) ? prev : [...prev, error.message]
                );
            } finally {
                setLoadingDiscount(false);
            }
        };
       
        checkForDiscounts();
    }, []);

    const contextValue = useMemo(
        () => ({ discountData, loadingDiscount, loadingErrors, isDiscountAvailable }),
        [discountData, loadingDiscount, loadingErrors, isDiscountAvailable]
    );

    return(
        <DiscountContext.Provider value={contextValue}>
            {children}
        </DiscountContext.Provider>
    );
}