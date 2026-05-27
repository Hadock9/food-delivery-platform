import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { register, getAuthErrorMessage } from '../api/Auth.jsx';
import { useUser } from '../context/UserContext.jsx';
import './styles/RegisterForm.css';

const RegisterForm = () => {
    const { reloadUser } = useUser();
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
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
            await register(formData);
            await reloadUser();
            alert(`Welcome, ${formData.name}! 🎉`);
            window.location.href = "/food-delivery-platform/customer";
        } catch (err) {
            setError(getAuthErrorMessage(err, "Не вдалося зареєструватись. Спробуйте ще раз."));
        }
    };

    return (
        <div className="page-wrapper">
            <div className="register-container">
                <h2>Create Your Account</h2>
                {error && <p className="error-text">{error}</p>}
                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="fullname-inputs">
                        <input
                            type="text"
                            name="name"
                            placeholder="First Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="text"
                            name="surname"
                            placeholder="Last Name"
                            value={formData.surname}
                            onChange={handleChange}
                            required
                        />
                    </div>
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
                        minLength={6}
                    />
                    <p className="hint-text" style={{ fontSize: "0.85rem", opacity: 0.8, margin: "0.25rem 0 0.75rem" }}>
                        Мін. 6 символів, велика й мала літера, цифра та спецсимвол (напр. Test123!)
                    </p>
                    <button type="submit">Register</button>
                </form>
                <p className="login-text">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
