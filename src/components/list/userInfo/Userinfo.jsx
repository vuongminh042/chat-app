import { useUserStore } from '../../../lib/userStore'
import './userInfo.css'

const Userinfo = () => {
    const { currentUser } = useUserStore()

    return (
        <div className='userInfo'>
            <div className='user'>
                <img src={currentUser.avatar ||
                    "https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Favatar.png?alt=media&token=a68ba9cf-5407-4d96-b4fc-9d769ebe78b8"}
                    alt=""
                />
                <h2>{currentUser.username}</h2>
            </div>
            <div className='icons'>
                <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fmore.png?alt=media&token=b115290c-6a57-47c1-a243-6df93525b0cc" alt="" />
                <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fvideo.png?alt=media&token=797830eb-5bc5-492b-ae63-cd461d34e3a7" alt="" />
                <img src="https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Fedit.png?alt=media&token=7cc77198-742e-4e7d-b3f9-b3c218d0d231" alt="" />
            </div>
        </div>
    )
}

export default Userinfo
