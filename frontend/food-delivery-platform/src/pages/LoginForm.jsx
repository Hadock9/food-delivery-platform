import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, getAuthErrorMessage } from '../api/Auth.jsx';
import { useUser } from '../context/UserContext.jsx';
import { resolveAppRole } from '../utils/appRole.js';
import { homePathForRole, ROUTES } from '../utils/roleRoutes.js';
import './styles/LoginForm.css';

const LoginForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { reloadUser } = useUser();
    const returnTo = location.state?.from || "/";

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await login(formData);
            const profile = await reloadUser();

            const role = resolveAppRole(profile?.user, profile?.accounts, profile?.currentAccount?.id, null);
            const target =
                returnTo && returnTo !== "/" && returnTo !== ROUTES.home
                    ? returnTo
                    : homePathForRole(role);
            navigate(target, { replace: true });
        } catch (err) {
            setError(getAuthErrorMessage(err));
        }
    };


    return (
        <div className="page-wrapper">
            <div className="register-container">
                <h2>Увійти в Foodie Delivery 🍔</h2>
                {error && <p className="error-text">{error}</p>}
                <p className="hint-text" style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: "1rem" }}>
                    Немає акаунта? <Link to="/register">Зареєструйтесь</Link> — пароль мін. 6 символів, велика/мала літера, цифра та спецсимвол (напр. Test123!)
                </p>
                <form className="register-form" onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit">Login</button>
                </form>
                <p className="login-text">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;