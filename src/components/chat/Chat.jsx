import { useEffect, useRef, useState } from 'react';
import './chat.css';
import EmojiPicker from 'emoji-picker-react';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import upload from '../../lib/upload';

const Chat = () => {
    const [chat, setChat] = useState();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [img, setImg] = useState({
        file: null,
        url: ""
    });
    const [isTyping, setIsTyping] = useState(false);

    const { currentUser } = useUserStore();
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

    const endRef = useRef(null);

    useEffect(() => {
        const handleTyping = async () => {
            const chatRef = doc(db, "chats", chatId);
            await updateDoc(chatRef, {
                [`isTyping.${currentUser.uid}`]: {
                    isTyping: true,
                    username: currentUser.username
                }
            });
        };

        const handleStopTyping = async () => {
            const chatRef = doc(db, "chats", chatId);
            await updateDoc(chatRef, {
                [`isTyping.${currentUser.uid}`]: {
                    isTyping: false,
                    username: currentUser.username
                }
            });
        };

        if (text.length > 0) {
            handleTyping();
        } else {
            handleStopTyping();
        }

        const timeoutId = setTimeout(() => {
            if (text.length > 0) {
                handleStopTyping();
            }
        }, 3000);

        return () => clearTimeout(timeoutId);
    }, [text, chatId, currentUser.uid]);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            const chatData = res.data();
            setChat(chatData);

            if (chatData?.isTyping) {
                const typingUser = Object.values(chatData.isTyping).find(user => user.isTyping);
                if (typingUser) {
                    setIsTyping(typingUser.username);
                } else {
                    setIsTyping(false);
                }
            }

            if (chatData?.messages?.length > 0) {
                const unreadMessages = chatData.messages.filter(
                    (message) => message.senderId !== currentUser.id && !message.isSeen
                );

                if (unreadMessages.length > 0) {
                    setTimeout(() => {
                        const updatedMessages = chatData.messages.map((message) => {
                            if (message.senderId !== currentUser.id && !message.isSeen) {
                                return { ...message, isSeen: true };
                            }
                            return message;
                        });
                        updateDoc(doc(db, "chats", chatId), { messages: updatedMessages }).catch((error) => {
                            console.error("Error updating seen status:", error);
                        });
                    }, 5000);
                }
            }
        });

        return () => {
            unSub();
        };
    }, [chatId, currentUser.id, user.uid]);

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleImg = (e) => {
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const handleSend = async () => {
        if (text === "") return;

        let imgUrl = null;

        try {
            if (img.file) {
                imgUrl = await upload(img.file);
            }

            // Gửi tin nhắn mới
            const newMessage = {
                senderId: currentUser.id,
                text,
                createdAt: new Date(),
                isSeen: false,
                status: 'sent',
                ...(imgUrl && { img: imgUrl })
            };

            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion(newMessage)
            });

            setTimeout(async () => {
                const chatRef = doc(db, "chats", chatId);
                const chatSnapshot = await getDoc(chatRef);
                const chatData = chatSnapshot.data();

                if (chatData?.messages) {
                    const updatedMessages = chatData.messages.map((msg) =>
                        msg.createdAt === newMessage.createdAt
                            ? { ...msg, status: 'received' }
                            : msg
                    );

                    await updateDoc(chatRef, { messages: updatedMessages });
                }
            }, 8000);

            const userIDs = [currentUser.id, user.id];
            userIDs.forEach(async (id) => {
                const userChatsRef = doc(db, "userchats", id);
                const userChatsSnapshot = await getDoc(userChatsRef);

                if (userChatsSnapshot.exists()) {
                    const userChatsData = userChatsSnapshot.data();

                    if (Array.isArray(userChatsData.chats)) {
                        const chatIndex = userChatsData.chats.findIndex(c => c.chatId === chatId);

                        if (chatIndex !== -1) {
                            userChatsData.chats[chatIndex].lastMessage = text;
                            userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
                            userChatsData.chats[chatIndex].updatedAt = Date.now();

                            await updateDoc(userChatsRef, {
                                chats: userChatsData.chats
                            });
                        }
                    }
                }
            });
        } catch (error) {
            console.log(error);
        }

        setImg({ file: null, url: "" });
        setText("");
    };

    return (
        <div className='chat'>
            <div className='top'>
                <div className='user'>
                    <img src={user?.avatar || "default-avatar-url"} alt="" />
                    <div className='texts'>
                        <span>{user?.username}</span>
                    </div>
                </div>
                <div className='icons'>
                    <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fphone.png?alt=media&token=c9881096-413d-4452-82f3-9d533671f341" alt="" />
                    <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fvideo.png?alt=media&token=797830eb-5bc5-492b-ae63-cd461d34e3a7" alt="" />
                    <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Finfo.png?alt=media&token=447088c4-87ff-4eeb-9767-3798a15c64a5" alt="" />
                </div>
            </div>
            <div className='center'>
                {chat?.messages?.map((message) => (
                    <div className={message.senderId === currentUser.id ? "message own" : "message"} key={message?.createdAt}>
                        <div className='texts'>
                            {message.img && <img src={message.img} alt="" />}
                            <p>{message.text}</p>
                        </div>
                    </div>
                ))}
                {img.url && <div className='message own'>
                    <div className='texts'>
                        <img src={img.url} alt="" />
                    </div>
                </div>}
                <div ref={endRef}></div>
            </div>

            <div className='bottom'>
                <div className='icons'>
                    <label htmlFor='file'>
                        <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fimg.png?alt=media&token=5be4cca7-3384-41b0-89d8-c82d412c2a68" alt="" />
                    </label>
                    <input type="file" id='file' style={{ display: 'none' }} onChange={handleImg} />
                </div>

                <input type="text" placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "Bạn không thể gửi tin nhắn" : "Nhập tin nhắn..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <div className='emoji'>
                    <img
                        src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Femoji.png?alt=media&token=847f34bd-e382-4cfa-903a-b1ede46ebec3"
                        alt="emoji"
                        onClick={() => setOpen(!open)}
                    />
                    {open && <EmojiPicker className='picker' onEmojiClick={handleEmoji} />}
                </div>
                <button
                    className="sendButton"
                    onClick={handleSend}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                >
                    Send
                </button>
            </div>

            {/* Hiển thị thông báo đang gõ cho người dùng hiện tại khi người khác đang soạn tin */}
            {isTyping && !chat?.isTyping[currentUser.id] && (
                <div className='typing-indicator'>{isTyping} đang soạn tin...</div>
            )}
        </div>
    );
};

export default Chat;
