import { useState } from 'react';
import './login.css';
import { toast } from 'react-toastify';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import upload from '../../lib/upload';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
    username: Yup.string()
        .required('Username is required')
        .min(5, 'Username must be at least 5 characters long')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: Yup.string()
        .required('Email is required')
        .email('Email is invalid'),
    password: Yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[\W_]/, 'Password must contain at least one special character'),
    file: Yup.mixed().test('fileType', 'Only image files are allowed (jpeg, jpg, png)', (value) => {
        return value && ['image/jpeg', 'image/jpg', 'image/png'].includes(value.type);
    }),
});

const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });

    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm({
        resolver: yupResolver(validationSchema)
    });

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
            setValue('file', e.target.files[0]); // Set avatar as file for validation
        }
    };

    const handleRegister = async (data) => {
        setLoading(true);

        const { username, email, password } = data;

        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);

            const imgUrl = await upload(avatar.file);

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

            toast.success("Sign up successful ✅");
        } catch (error) {
            console.log(error);
            toast.error('Sign up Failed ❎');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (data) => {
        setLoading(true);

        const { email, password } = data;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login successful ✅");
        } catch (error) {
            console.log(error);
            toast.error('Login Failed ❎');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login">
            <div className='item'>
                <h2>Welcome back</h2>
                <form onSubmit={handleSubmit(handleLogin)}>
                    <input
                        type="email"
                        placeholder='Enter your email'
                        {...register('email')}
                    />
                    {errors.email && <p className='error-message'>{errors.email.message}</p>}
                    <input
                        type="password"
                        placeholder='Enter your password'
                        {...register('password')}
                    />
                    {errors.password && <p className='error-message'>{errors.password.message}</p>}
                    <button disabled={loading}>{loading ? "Loading" : "Login"}</button>
                </form>
            </div>
            <div className='separator'></div>
            <div className='item'>
                <h2>Create an Account</h2>
                <form onSubmit={handleSubmit(handleRegister)}>
                    <label htmlFor='file'>
                        <img src={avatar.url || "https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Favatar.png?alt=media&token=a68ba9cf-5407-4d96-b4fc-9d769ebe78b8"}
                            alt=""
                        />
                        Upload an Image
                    </label>
                    <input
                        type="file"
                        id='file'
                        style={{ display: 'none' }}
                        onChange={handleAvatar}
                    />
                    {errors.file && <p className='error-message'>{errors.file.message}</p>}
                    <input
                        type="text"
                        placeholder='Enter your username'
                        {...register('username')}
                    />
                    {errors.username && <p className='error-message'>{errors.username.message}</p>}
                    <input
                        type="email"
                        placeholder='Enter your email'
                        {...register('email')}
                    />
                    {errors.email && <p className='error-message'>{errors.email.message}</p>}
                    <input
                        type="password"
                        placeholder='Enter your password'
                        {...register('password')}
                    />
                    {errors.password && <p className='error-message'>{errors.password.message}</p>}
                    <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
