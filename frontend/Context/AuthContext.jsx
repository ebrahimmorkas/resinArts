import { useContext, useState, useEffect, Children, createContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
    const checkLogin = async() => {
      try {
        const res = await axios.get(
          'http://localhost:3000/api/auth/me',
          {withCredentials: true},
        );
        console.log("You are logged in")
        setUser(res.data.user)
      } catch(err) {
        setUser(null);
        // navigate('/auth/login');
      } finally {
        setLoading(false);
      }

    }
    checkLogin();
  }, [])

  return(
    <AuthContext.Provider value={{ user, setUser, loading }}>
        {children}
    </AuthContext.Provider>
  )
}
