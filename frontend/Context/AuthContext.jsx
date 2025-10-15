import { useState, useEffect, createContext, useMemo } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkLogin = async() => {
        try {
          // Check sessionStorage cache first
          const cachedUser = sessionStorage.getItem('authUser');
          const cacheTimestamp = sessionStorage.getItem('authUserTime');
          
          if (cachedUser && cacheTimestamp) {
            const now = Date.now();
            const cacheAge = now - parseInt(cacheTimestamp);
            
            // Use cache if less than 5 minutes old
            if (cacheAge < 300000) {
              setUser(JSON.parse(cachedUser));
              setLoading(false);
              return;
            }
          }

          const res = await axios.get(
            'https://api.simplyrks.cloud/api/auth/me',
            {withCredentials: true},
          );
          
          const userData = res.data.user;
          setUser(userData);
          
          // Cache the user data
          sessionStorage.setItem('authUser', JSON.stringify(userData));
          sessionStorage.setItem('authUserTime', Date.now().toString());
          
        } catch(err) {
          setUser(null);
          sessionStorage.removeItem('authUser');
          sessionStorage.removeItem('authUserTime');
        } finally {
          setLoading(false);
        }
      }
      checkLogin();
    }, []);

    const contextValue = useMemo(
      () => ({ user, setUser, loading }),
      [user, loading]
    );

    return(
      <AuthContext.Provider value={contextValue}>
          {children}
      </AuthContext.Provider>
    )
}