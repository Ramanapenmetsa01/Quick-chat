import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

const backendUrl = import.meta.env.VITE_BACKEND_URL
axios.defaults.baseURL = backendUrl
export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"))
    const [authUser, setAuthUser] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState([])
    const [socket, setSocket] = useState(null)


    const checkAuth = async () => {
        try {
            const response = await axios.get("/api/auth/check")
            if (response.data.success) {
                setAuthUser(response.data.user)
                connectSocket(response.data.user)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // connect socket function to handle socket connection and online users updates
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id
            }
        })
        newSocket.connect()
        setSocket(newSocket)
        newSocket.on("getOnlineUsers",(userIds)=>{
            setOnlineUsers(userIds)
        })
    }

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["token"] = token
            checkAuth()
        }
    }, [])

    // update profile function to handle user profile updates

    const updateProfile=async(body)=>{
        const loadingToast = toast.loading("Updating profile...");
        try {
            const {data}=await axios.put('/api/auth/updateProfile',body)
            if(data.success){
                setAuthUser(data.user);
                toast.success("profile Updated succesfully")
            }
        } catch (error) {
            toast.error(error.message)
        }finally{
             toast.dismiss(loadingToast);
        }
    }
    // login functionality to handle user authentication and socket connection
    const login=async(state,credentials)=>{
            try {
                const response=await axios.post(`/api/auth/${state}`,credentials)
                if(response.data.success){
                    setAuthUser(response.data.userData)
                    connectSocket(response.data.userData)
                    axios.defaults.headers.common["token"] = response.data.token
                    setToken(response.data.token)
                    localStorage.setItem("token",response.data.token)
                    toast.success(response.data.message)
                }else{
                    toast.error(response.data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
    }

    // logout functionality to handle user logout and socket disconnection
    const logout=async()=>{
        localStorage.removeItem("token");
        setToken(null)
        setAuthUser(null)
        setOnlineUsers([])
        axios.defaults.headers.common["token"]=null
        toast.success("logged out successfully")
        socket?.disconnect();
    }

    
    const value = {
        axios,
        token,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
    }
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}