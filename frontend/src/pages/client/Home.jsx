import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

function Home() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      const checkLogin = async () => {
        try {
            const res = await axios.get(
                'http://localhost:3000/api/auth/me',
                {
                    withCredentials: true,
                },
            );
            setUser(res.data.user);
        } catch(err) {
            setUser(null);
            navigate('/auth/login');
            console.log(err.data);
        }
      }
    checkLogin();
    }, [])
    
  return (
    <div>Hello</div>
  )
}

export default Home