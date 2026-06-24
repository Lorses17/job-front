import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('seeker'); // По умолчанию 'seeker' (соискатель)
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Отправляем POST-запрос на FastAPI
            await API.post('/auth/register', { email, password, role });
            alert('Регистрация успешна! Теперь вы можете войти.');
            navigate('/login'); // Перенаправляем на страницу входа
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при регистрации. Возможно, этот Email занят.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Регистрация в платформе</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Пароль:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Кто вы?</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    >
                        <option value="seeker">Соискатель (Ищу работу)</option>
                        <option value="employer">Работодатель (Ищу сотрудников)</option>
                    </select>
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Зарегистрироваться
                </button>
            </form>
            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
        </div>
    );
};

export default Register;