import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import nacl from "tweetnacl";
import * as util from "tweetnacl-util";
import { encryptPrivateKey,decryptPrivateKey } from "../utils/crypto";


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
            toast.dismiss()
            toast.error(error.message)
        }
    }

    // connect socket function to handle socket connection and online users updates
   const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
        query: {
            userId: userData._id
        },
        transports: ["websocket"]
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
        setOnlineUsers(userIds);
    });
};


    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["token"] = token
            checkAuth()
        }
    }, [])

    // update profile function to handle user profile updates

    const updateProfile = async (body) => {
        const loadingToast = toast.loading("Updating profile...");
        try {
            const { data } = await axios.put('/api/auth/updateProfile', body)
            if (data.success) {
                setAuthUser(data.user);
                toast.success("profile Updated succesfully")
            }
        } catch (error) {
            toast.dismiss()
            toast.error(error.message)
        } finally {
            toast.dismiss()
            toast.dismiss(loadingToast);
        }
    }
    // login functionality to handle user authentication and socket connection
    const login = async (state, credentials) => {
        try {
            if (state === "signup") {

                // generate key pair
                const keyPair = nacl.box.keyPair();

                credentials.publicKey = util.encodeBase64(keyPair.publicKey);

                const privateKey = util.encodeBase64(keyPair.secretKey);
                // encrypt private key
                const { encryptedPrivateKey, salt, iv } =
                    await encryptPrivateKey(privateKey, credentials.password);

                credentials.encryptedPrivateKey = encryptedPrivateKey;
                credentials.salt = salt;
                credentials.iv = iv;
            }
            const response = await axios.post(`/api/auth/${state}`, credentials)
            if (response.data.success) {
                const user = response.data.userData;
                // decrypt private key using password
                const privateKey = await decryptPrivateKey(
                    user.encryptedPrivateKey,
                    credentials.password,
                    user.salt,
                    user.iv
                );
                // store private key securely
                sessionStorage.setItem("privateKey", privateKey);
                axios.defaults.headers.common["token"] = response.data.token;
                setAuthUser(user);
                connectSocket(user);
                setToken(response.data.token);
                localStorage.setItem("token", response.data.token);
                toast.success(response.data.message);

            } else {
                toast.dismiss()
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.dismiss()
            toast.error(error.message)
        }
    }

    // logout functionality to handle user logout and socket disconnection
    const logout = async () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("privateKey");
        setToken(null)
        setAuthUser(null)
        setOnlineUsers([])
        axios.defaults.headers.common["token"] = null
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