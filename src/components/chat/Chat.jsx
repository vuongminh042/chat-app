import { useEffect, useRef, useState } from 'react';
import './chat.css';
import EmojiPicker from 'emoji-picker-react';
import { arrayUnion, arrayRemove, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
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

    const [isEditing, setIsEditing] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);

    const { currentUser } = useUserStore();
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            setChat(res.data());
        });

        return () => {
            unSub();
        };
    }, [chatId]);

    const handleEmoji = e => {
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleImg = e => {
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    // Hàm chỉnh sửa tin nhắn
    const handleEditMessage = (message) => {
        setText(message.text);
        setIsEditing(true);
        setEditingMessage(message);
    };

    // Hàm xóa tin nhắn
    const handleDeleteMessage = async (message) => {
        try {
            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayRemove(message)
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleSend = async () => {
        if (text === "") return;

        let imgUrl = null;

        try {
            if (img.file) {
                imgUrl = await upload(img.file);
            }

            if (isEditing && editingMessage) {
                const updatedMessages = chat.messages.map((msg) =>
                    msg.createdAt === editingMessage.createdAt ? { ...msg, text } : msg
                );
                await updateDoc(doc(db, "chats", chatId), { messages: updatedMessages });
                setIsEditing(false);
                setEditingMessage(null);
            } else {
                // Gửi tin nhắn mới
                await updateDoc(doc(db, "chats", chatId), {
                    messages: arrayUnion({
                        senderId: currentUser.id,
                        text,
                        createdAt: new Date(),
                        ...(imgUrl && { img: imgUrl })
                    })
                });
            }

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
                    <img src={user?.avatar || "https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Favatar.png?alt=media&token=a68ba9cf-5407-4d96-b4fc-9d769ebe78b8"} alt="" />
                    <div className='texts'>
                        <span>{user?.username}</span>
                    </div>
                </div>
                <div className='icons'>
                    <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fphone.png?alt=media&token=c9881096-413d-4452-82f3-9d533671f341" alt="" />
                </div>
            </div>
            <div className='center'>
                {chat?.messages?.map((message) => (
                    <div className={message.senderId === currentUser?.id ? "message own" : "message"} key={message?.createdAt}>
                        <div className='texts'>
                            {message.img && <img src={message.img} alt="" />}
                            <p>{message.text}</p>

                            {message.senderId === currentUser?.id && (
                                <div className="message-actions">
                                    <button onClick={() => handleEditMessage(message)}>Edit</button>
                                    <button onClick={() => handleDeleteMessage(message)}>Delete</button>
                                </div>
                            )}
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
                <input type="text" placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "You can not message" : "Type a message"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <div className='emoji'>
                    <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Femoji.png?alt=media&token=847f34bd-e382-4cfa-903a-b1ede46ebec3" alt="" onClick={() => setOpen((prev) => !prev)} />
                    <div className='picker'>
                        <EmojiPicker open={open} onEmojiClick={handleEmoji} />
                    </div>
                </div>
                <br />
                <button className='sendButton' onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}

                >
                    {isEditing ? "Update" : "Send"}
                </button>
            </div>
        </div>
    );
};

export default Chat;
