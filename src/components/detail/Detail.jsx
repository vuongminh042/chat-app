import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useChatStore } from '../../lib/chatStore';
import { auth, db } from '../../lib/firebase';
import { useUserStore } from '../../lib/userStore';
import './detail.css';

const Detail = () => {
    const { user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
    const { currentUser } = useUserStore()


    const handleBlock = async () => {
        if (!user) return;

        const userDocRef = doc(db, "users", currentUser.id)

        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            })
            changeBlock()
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className='detail'>
            <div className='user'>
                <img src={user?.avatar || "public/avatar.png"} alt="" />
                <h2>{user?.username}</h2>
            </div>

            <div className='info'>
                {/* Chat Setting */}
                <div className='option'>
                    <div className='title'>
                        <span>Chat Settings</span>
                        <img src="public/arrowDown.png" alt="" />
                    </div>
                </div>
            </div>
            {/* Block User Button */}
            <button onClick={handleBlock}>
                {isCurrentUserBlocked
                    ? "You are Blocked ?"
                    : isReceiverBlocked
                        ? "User blocked"
                        : "Block User"}
            </button>
            {/* Logout */}
            <button className='logout' onClick={() => auth.signOut()}>Logout</button>
        </div>
    );
};

export default Detail;
