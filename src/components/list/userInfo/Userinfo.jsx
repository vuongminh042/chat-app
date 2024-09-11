import { useUserStore } from '../../../lib/userStore'
import './userInfo.css'

const Userinfo = () => {
    const { currentUser } = useUserStore()

    return (
        <div className='userInfo'>
            <div className='user'>
                <img src={currentUser.avatar || "public/avatar.png"} alt="" />
                <h2>{currentUser.username}</h2>
            </div>
            <div className='icons'>
                <img src="public/more.png" alt="" />
                <img src="public/video.png" alt="" />
                <img src="public/edit.png" alt="" />
            </div>
        </div>
    )
}

export default Userinfo
