import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import { encryptMessage, decryptMessage } from "../utils/crypto";

export const ChatContext = createContext()
export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const { axios, socket, authUser } = useContext(AuthContext)
    const queryClient = useQueryClient()


useEffect(() => {
    if (!socket) return;
    const handleFriendAccepted = (data) => {
        queryClient.invalidateQueries({
            queryKey: ["friends"]
        });
    };
    socket.on("friendAccepted", handleFriendAccepted);
    return () => {
        socket.off("friendAccepted", handleFriendAccepted);
    };
}, [socket, queryClient]);


    //function to get all users for sidebars
    const fetchUsers = async () => {
        const { data } = await axios.get("/api/messages/friendUsers")
        if (!data.success) {
            throw new Error(data.message)
        }
        return data
    }
    const { data } = useQuery({
        queryKey: ["friends"],
        queryFn: fetchUsers,
        enabled: !!authUser, // IMPORTANT FIX
    })

    const users = data?.users || []
    const unseenMessages = data?.unseenMessages || {}


    // function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const privateKey = sessionStorage.getItem("privateKey");
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                const decryptedMessages = data.messages.map(msg => {

                    // decrypt only text messages
                    if (msg.text && msg.nonce) {
                        const senderPublicKey = selectedUser.publicKey;
                        const decryptedText = decryptMessage(
                            msg.text,
                            msg.nonce,
                            senderPublicKey,
                            privateKey
                        );

                        return {
                            ...msg,
                            text: decryptedText
                        };
                    }
                    return msg;
                });
                setMessages(decryptedMessages);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };


    // function to send mesasage to selected user
    const sendMessage = async (messageData) => {
        try {
            const privateKey = sessionStorage.getItem("privateKey");

            let payload = {};

            // encrypt text message
            if (messageData.text) {
                const { encryptedMessage, nonce } = encryptMessage(
                    messageData.text,
                    selectedUser.publicKey,
                    privateKey
                );
                payload.text = encryptedMessage;
                payload.nonce = nonce;
            }
            if (messageData.image) {
                payload.image = messageData.image;
            }
            const { data } = await axios.post(
                `/api/messages/send/${selectedUser._id}`,
                payload
            );

            if (data.success) {

                const newMessage = data.newMessage;

                // decrypt before displaying
                if (newMessage.text && newMessage.nonce) {

                    const privateKey = sessionStorage.getItem("privateKey");

                    const decryptedText = decryptMessage(
                        newMessage.text,
                        newMessage.nonce,
                        selectedUser.publicKey,
                        privateKey
                    );

                    newMessage.text = decryptedText;
                }

                setMessages(prev => [...prev, newMessage]);
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.messages)

        }
    }

    //function to subscribe to messages for selected user instantly with socket
    const subscribeToMessages = async () => {
        if (!socket) return
        socket.on("newMessage", (newMessage) => {
            const privateKey = sessionStorage.getItem("privateKey");

            // decrypt live incoming message
            if (newMessage.text && newMessage.nonce && privateKey && selectedUser) {

                const decryptedText = decryptMessage(
                    newMessage.text,
                    newMessage.nonce,
                    selectedUser.publicKey,
                    privateKey
                );

                newMessage.text = decryptedText;
            }

            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true

                setMessages(prev => [...prev, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`)
            } else {
                queryClient.setQueryData(["friends"], (oldData) => {

                    if (!oldData) return oldData

                    const updatedUnseen = {
                        ...oldData.unseenMessages,
                        [newMessage.senderId]:
                            (oldData.unseenMessages?.[newMessage.senderId] || 0) + 1
                    }

                    return {
                        ...oldData,
                        unseenMessages: updatedUnseen
                    }
                })

            }
        })
    }

    //function to unsubcribe from messages
    const unsubcribeFromMessages = () => {
        if (socket) socket.off("newMessage")
    }

    useEffect(() => {
        subscribeToMessages()
        return () => unsubcribeFromMessages()
    }, [socket, selectedUser])
    const value = {
        messages,
        users,
        selectedUser,
        setMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        getMessages
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}