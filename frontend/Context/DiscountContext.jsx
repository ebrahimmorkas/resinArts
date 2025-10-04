import axios from 'axios';
import React, { createContext, useEffect, useState } from 'react';

export const DiscountContext = createContext();

export const DiscountProvider = ({children}) => {
    const [discountData, setDiscountData] = useState([]);
    const [loadingDiscount, setLoadingDiscount] = useState(true);
    const [loadingErrors, setLoadingErrors] = useState([]);
    const [isDiscountAvailable, setIsDiscountAvailable] = useState(false);

    useEffect(() => {
        const checkForDiscounts = async () => {
            try {
                const res = await axios.get('https://api.simplyrks.cloud/api/discount/fetch-discount', {
                    withCredentials: true
                });
                
                if(res.status === 200) {
                    console.log("Discount data", res.data.data);
                    setDiscountData(res.data.data);
                    setIsDiscountAvailable(res.data.data.length > 0);
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

    return(
        <DiscountContext.Provider value={{ discountData, loadingDiscount, loadingErrors, isDiscountAvailable }}>
            {children}
        </DiscountContext.Provider>
    );
}