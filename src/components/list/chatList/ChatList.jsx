import { useEffect, useState } from 'react';
import './chatList.css';
import AddUser from './addUser/addUser';
import { useUserStore } from '../../../lib/userStore';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useChatStore } from '../../../lib/chatStore';

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const [input, setInput] = useState("");

    const { currentUser } = useUserStore();
    const { chatId, changeChat } = useChatStore();

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
            const items = res.data().chats;

            const promises = items.map(async (item) => {
                const userDocRef = doc(db, "users", item.receiverId);
                const userDocSnap = await getDoc(userDocRef);

                const user = userDocSnap.data();

                return { ...item, user };
            });

            const chatData = await Promise.all(promises);

            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });

        return () => {
            unSub();
        };
    }, [currentUser.id]);

    const handleSelect = async (chat) => {
        const userChats = chats.map((item) => {
            const { user, ...rest } = item;
            return rest;
        });

        const chatIndex = userChats.findIndex(item => item.chatId === chat.chatId);

        userChats[chatIndex].isSeen = true;

        const userChatsRef = doc(db, "userchats", currentUser.id);

        try {
            await updateDoc(userChatsRef, {
                chats: userChats,
            });
            changeChat(chat.chatId, chat.user);
        } catch (error) {
            console.log(error);
        }
    };

    const filteredChats = chats.filter(c => c.user.username.toLowerCase().includes(input.toLowerCase()));

    return (
        <div className="chatList">
            <div className='search'>
                <div className='searchBar'>
                    <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fsearch.png?alt=media&token=ee96d7b2-e2b6-48ec-90cd-89fb3afe9e97" alt="" />
                    <input type="text" placeholder='Search...' onChange={(e) => setInput(e.target.value)} />
                </div>
                <img src={addMode ? "https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fminus.png?alt=media&token=14dba43c-c5e3-4261-b59b-2ee59e72af80"
                    : "https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fplus.png?alt=media&token=2c1f61da-1500-4256-a913-9512cc0d784e"}
                    alt="" className='add'
                    onClick={() => setAddMode((prev) => !prev)}
                />
            </div>
            <div className="chatListContent">
                {filteredChats.map((chat) => (
                    <div className='item' key={chat.chatId} onClick={() => handleSelect(chat)}
                        style={{ backgroundColor: chat?.isSeen ? "transparent" : "#5183fe" }}
                    >
                        <img
                            src={chat.user.blocked.includes(currentUser.id)
                                ? "https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Favatar.png?alt=media&token=a68ba9cf-5407-4d96-b4fc-9d769ebe78b8"
                                : chat.user.avatar || "https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Favatar.png?alt=media&token=a68ba9cf-5407-4d96-b4fc-9d769ebe78b8"
                            }
                            alt="" />
                        <div className='texts'>
                            <span>{chat.user.blocked.includes(currentUser.id) ? "User" : chat.user.username}</span>
                            <p>{chat.lastMessage}</p>
                        </div>
                    </div>
                ))}
            </div>
            {addMode && <AddUser />}
        </div>
    );
};

export default ChatList;
