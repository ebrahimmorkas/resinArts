import { createContext, useState, useEffect, useCallback } from "react";
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({children}) => {
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [users, setUsers] = useState([]);
    const [usersError, setUsersError] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoadingUsers(true);
            const res = await axios.get('http://localhost:3000/api/user/all', {withCredentials: true});
            if (res.data.users && res.data.users.length > 0) {
                setUsers(res.data.users);
                setUsersError(null);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error("User fetch error:", error.message);
            setUsersError(error.message);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return (
        <UserContext.Provider value={{users, loadingUsers, usersError, refetchUsers: fetchUsers}}>
            {children}
        </UserContext.Provider>
    )
}