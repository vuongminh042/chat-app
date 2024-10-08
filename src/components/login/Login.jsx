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

// Validation schema for sign up
const signUpSchema = Yup.object().shape({
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

// Validation schema for login
const loginSchema = Yup.object().shape({
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
});

const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });

    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loadingSignUp, setLoadingSignUp] = useState(false);

    // State for showing password
    const [showPasswordLogin, setShowPasswordLogin] = useState(false);
    const [showPasswordSignUp, setShowPasswordSignUp] = useState(false);

    // useForm for login with validation schema
    const {
        register: registerLogin,
        handleSubmit: handleSubmitLogin,
        formState: { errors: loginErrors }
    } = useForm({
        resolver: yupResolver(loginSchema)
    });

    // useForm for sign up with validation schema
    const {
        register: registerSignUp,
        handleSubmit: handleSubmitSignUp,
        formState: { errors: signUpErrors },
        setValue: setValueSignUp
    } = useForm({
        resolver: yupResolver(signUpSchema)
    });

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
            setValueSignUp('file', e.target.files[0]); // Set avatar as file for validation in sign up form
        }
    };

    const handleRegister = async (data) => {
        setLoadingSignUp(true);

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
            setLoadingSignUp(false);
        }
    };

    const handleLogin = async (data) => {
        setLoadingLogin(true);

        const { email, password } = data;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login successful ✅");
        } catch (error) {
            console.log(error);
            toast.error('Login Failed ❎');
        } finally {
            setLoadingLogin(false);
        }
    };

    return (
        <div className="login">
            {/* Form đăng nhập */}
            <div className='item'>
                <h2>Welcome back</h2>
                <form onSubmit={handleSubmitLogin(handleLogin)}>
                    <input
                        type="email"
                        placeholder='Enter your email'
                        {...registerLogin('email')}
                    />
                    {loginErrors.email && <p className='error-message'>{loginErrors.email.message}</p>}
                    <div className="password-container">
                        <input
                            type={showPasswordLogin ? "text" : "password"}
                            placeholder='Enter your password'
                            {...registerLogin('password')}
                            style={{ width: '320px' }}
                        />
                        <br />
                        <br />
                        <button
                            type="button"
                            onClick={() => setShowPasswordLogin(prev => !prev)}
                        >
                            {showPasswordLogin ? "Hide" : "Show"}
                        </button>
                    </div>
                    {loginErrors.password && <p className='error-message'>{loginErrors.password.message}</p>}
                    <button type="submit" disabled={loadingLogin}>{loadingLogin ? "Loading" : "Login"}</button>
                </form>
            </div>

            <div className='separator'></div>

            {/* Form đăng ký */}
            <div className='item'>
                <h2>Create an Account</h2>
                <form onSubmit={handleSubmitSignUp(handleRegister)}>
                    <label htmlFor='file'>
                        <img src={avatar.url || "https://firebasestorage.googleapis.com/v0/b/reactchat-2968d.appspot.com/o/image-project%2Favatar.png?alt=media&token=a68ba9cf-5407-4d96-b4fc-9d769ebe78b8"}
                            alt="Avatar"
                        />
                        Upload an Image
                    </label>
                    <input
                        type="file"
                        id='file'
                        style={{ display: 'none' }}
                        onChange={handleAvatar}
                    />
                    {signUpErrors.file && <p className='error-message'>{signUpErrors.file.message}</p>}
                    <input
                        type="text"
                        placeholder='Enter your username'
                        {...registerSignUp('username')}
                    />
                    {signUpErrors.username && <p className='error-message'>{signUpErrors.username.message}</p>}
                    <input
                        type="email"
                        placeholder='Enter your email'
                        {...registerSignUp('email')}
                    />
                    {signUpErrors.email && <p className='error-message'>{signUpErrors.email.message}</p>}
                    <div className="password-container">
                        <input
                            type={showPasswordSignUp ? "text" : "password"}
                            placeholder='Enter your password'
                            {...registerSignUp('password')}
                            style={{ width: '320px' }}
                        />
                        <br />
                        <br />
                        <button
                            type="button"
                            onClick={() => setShowPasswordSignUp(prev => !prev)}
                        >
                            {showPasswordSignUp ? "Hide" : "Show"}
                        </button>
                    </div>
                    {signUpErrors.password && <p className='error-message'>{signUpErrors.password.message}</p>}
                    <button type="submit" disabled={loadingSignUp}>{loadingSignUp ? "Loading" : "Sign Up"}</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
