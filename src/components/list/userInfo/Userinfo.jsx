import { useUserStore } from '../../../lib/userStore'
import './userInfo.css'

const Userinfo = () => {
    const { currentUser } = useUserStore()

    return (
        <div className='userInfo'>
            <div className='user'>
                <img src={currentUser.avatar || "public/assets/avatar.png"} alt="" />
                <h2>{currentUser.username}</h2>
            </div>
            <div className='icons'>
                <img src="public/assets/more.png" alt="" />
                <img src="public/assets/video.png" alt="" />
                <img src="public/assets/edit.png" alt="" />
            </div>
        </div>
    )
}

export default Userinfo
