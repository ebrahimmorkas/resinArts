import { createContext, useState, useEffect } from "react";
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({children}) => {
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [users, setUsers] = useState([]);
    const [usersError, setUsersError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // console.log("Insdie user try")
                const res = await axios.get('http://localhost:3000/api/user/all', {withCredentials: true});

                if(res.data.users && res.data.users.length > 0) {
                    // console.log("everything went right from user context")
                    setUsers(res.data.users);
                }

                // console.log("If block didn't worked");
            } catch(error) {
                // console.log("Inside user catch");
                console.log(error.message);
                setUsersError(error.message);
            } finally {
                // console.log("user finally");
                setLoadingUsers(false);
            }
            
        };

        fetchUsers();
    }, [])
    return (
        <UserContext.Provider value={{users, loadingUsers, usersError}}>
            {children}
        </UserContext.Provider>
    )
}
