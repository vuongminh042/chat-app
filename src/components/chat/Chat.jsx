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

    const [isEditing, setIsEditing] = useState(false); // Để theo dõi trạng thái chỉnh sửa
    const [editingMessage, setEditingMessage] = useState(null); // Tin nhắn đang được chỉnh sửa

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
        setText(message.text);  // Đặt nội dung tin nhắn vào ô nhập văn bản
        setIsEditing(true); // Đặt trạng thái chỉnh sửa
        setEditingMessage(message); // Gán tin nhắn đang chỉnh sửa
    };

    // Hàm xóa tin nhắn
    const handleDeleteMessage = async (message) => {
        try {
            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayRemove(message) // Xóa tin nhắn khỏi Firebase
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

            // Nếu đang chỉnh sửa tin nhắn
            if (isEditing && editingMessage) {
                const updatedMessages = chat.messages.map((msg) =>
                    msg.createdAt === editingMessage.createdAt ? { ...msg, text } : msg
                );
                await updateDoc(doc(db, "chats", chatId), { messages: updatedMessages });
                setIsEditing(false); // Kết thúc quá trình chỉnh sửa
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

            // Cập nhật thông tin chat cho người dùng
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
                    <img src={user?.avatar || "../../../public/avatar.png"} alt="" />
                    <div className='texts'>
                        <span>{user?.username}</span>
                    </div>
                </div>
                <div className='icons'>
                    <img src="../../../public/phone.png" alt="" />
                    <img src="../../../public/video.png" alt="" />
                    <img src="../../../public/info.png" alt="" />
                </div>
            </div>
            <div className='center'>
                {chat?.messages?.map((message) => (
                    <div className={message.senderId === currentUser?.id ? "message own" : "message"} key={message?.createdAt}>
                        <div className='texts'>
                            {message.img && <img src={message.img} alt="" />}
                            <p>{message.text}</p>

                            {/* Nút Edit và Delete chỉ hiển thị với tin nhắn của người dùng */}
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
                        <img src="../../../public/img.png" alt="" />
                    </label>
                    <input type="file" id='file' style={{ display: 'none' }} onChange={handleImg} />
                    <img src="../../../public/camera.png" alt="" />
                    <img src="../../../public/mic.png" alt="" />
                </div>
                <input type="text" placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "You can not message" : "Type a message"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <div className='emoji'>
                    <img src="public/emoji.png" alt="" onClick={() => setOpen((prev) => !prev)} />
                    <div className='picker'>
                        <EmojiPicker open={open} onEmojiClick={handleEmoji} />
                    </div>
                </div>
                <button className='sendButton' onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}

                >
                    {isEditing ? "Update" : "Send"}
                </button>
            </div>
        </div>
    );
};

export default Chat;
