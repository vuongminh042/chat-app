import { useState } from 'react';
import './login.css'
import { toast } from 'react-toastify';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import upload from '../../lib/upload';


const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });

    const [loading, setLoading] = useState(false);

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            })
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.target);

        const { username, email, password } = Object.fromEntries(formData)

        try {
            const response = await createUserWithEmailAndPassword(auth, email, password)

            const imgUrl = await upload(avatar.file)

            await setDoc(doc(db, "users", response.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: response.user.uid,
                blocked: []
            });

            await setDoc(doc(db, "userchats", response.user.uid), {
                chats: []
            });


            toast.success("Sign up successful ✅")


        } catch (error) {
            console.log(error);
            toast.error('Sign up Failed ❎')
        } finally {
            setLoading(false)
        }
    }


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);

        const { email, password } = Object.fromEntries(formData)

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login successful ✅")
        } catch (error) {
            console.log(error);
            toast.error('Login Failed ❎');
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="login">
            <div className='item'>
                <h2>Welcome back</h2>
                <form onSubmit={handleLogin}>
                    <input type="email" placeholder='Enter your email' name='email' />
                    <input type="password" placeholder='Enter your password' name='password' />
                    <button disabled={loading}>{loading ? "Loading" : "Login"}</button>
                </form>
            </div>
            <div className='separator'></div>
            <div className='item'>
                <h2>Create an Account</h2>
                <form onSubmit={handleRegister}>
                    <label htmlFor='file'>
                        <img src={avatar.url || "public/avatar.png"} alt="" />
                        Upload an Image
                    </label>
                    <input type="file" id='file' style={{ display: 'none' }} onChange={handleAvatar} />
                    <input type="text" placeholder='Enter your username' name='username' />
                    <input type="email" placeholder='Enter your email' name='email' />
                    <input type="password" placeholder='Enter your password' name='password' />
                    <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
                </form>
            </div>

        </div>
    )
}

export default Login
