import { useEffect, useState } from 'react';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useChatStore } from '../../lib/chatStore';
import { auth, db } from '../../lib/firebase';
import { useUserStore } from '../../lib/userStore';
import './detail.css';

const Detail = () => {
    const { user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
    const { currentUser } = useUserStore();
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [userInfo, setUserInfo] = useState(null); // State to store user info

    // Function to fetch user info based on user ID
    const fetchUserInfo = async (userId) => {
        const userDocRef = doc(db, "users", userId);
        const userDocSnapshot = await userDocRef.get();

        if (userDocSnapshot.exists()) {
            setUserInfo(userDocSnapshot.data());
        } else {
            // Handle case where user doc doesn't exist
            console.error("User document does not exist");
        }
    };

    // Call fetchUserInfo when the user object changes
    useEffect(() => {
        if (user) {
            fetchUserInfo(user.id);
        }
    }, [user]);

    const handleBlock = async () => {
        if (!user) return;

        const userDocRef = doc(db, "users", currentUser.id);

        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            });
            changeBlock();
        } catch (error) {
            console.log(error);
        }
    };

    const toggleSettings = () => {
        setSettingsOpen(!isSettingsOpen);
    };

    return (
        <div className='detail'>
            {/* User info section */}
            <div className='user'>
                <img
                    src={user?.avatar || "https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Favatar.png?alt=media&token=a68ba9cf-5407-4d96-b4fc-9d769ebe78b8"}
                    alt=""
                    onClick={() => {
                        setUserInfo(userInfo ? null : user);
                    }}
                />
                <h2>{user?.username}</h2>
                {userInfo && (
                    <div className='user-info'>
                        <p>Username: {userInfo.username}</p>
                        <p>Email: {userInfo.email}</p>
                    </div>
                )}
            </div>

            {/* Chat settings section */}
            <div className='info'>
                <div className='option'>
                    <div
                        className={`title ${isSettingsOpen ? 'open' : ''}`}
                        onClick={toggleSettings}
                    >
                        <span>Chat Settings</span>
                        <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2FarrowDown.png?alt=media&token=94f462c2-a49e-46f9-87ef-7ff9c5acb599" alt="Arrow" />
                    </div>
                    {isSettingsOpen && (
                        <div className='settings'>
                            <button onClick={handleBlock} className='blockButton'>
                                {isCurrentUserBlocked
                                    ? "You are Blocked ?"
                                    : isReceiverBlocked
                                        ? "User blocked"
                                        : "Block User"}
                            </button>
                            <button className='logout' onClick={() => auth.signOut()}>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Detail;