import React, { useState } from 'react';
import API from '../api/axios';
import { useNavigate } from "react-router";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // 1. Отправляем запрос на бэкенд
            const response = await API.post('/auth/login', { email, password });

            // Выводим в консоль, чтобы ты мог нажать F12 и увидеть реальные ключи
            console.log("Что конкретно прислал бэкенд:", response?.data);

            // Проверяем все возможные варианты названия ключа токена:
            const token = response?.data?.access_token ||
                response?.data?.token ||
                response?.data?.accessToken ||
                response?.data?.data?.access_token; // на случай вложенности

            if (!token) {
                // Если токен вообще не найден, выведем в ошибку ключи, которые прислал бэк
                const keys = response?.data ? Object.keys(response.data).join(', ') : 'пустой ответ';
                throw new Error(`Токен отсутствует. Бэкенд прислал ключи: { ${keys} }`);
            }

            // Сохраняем токен в память браузера
            localStorage.setItem('token', token);

            // 2. Декодируем JWT-токен, чтобы узнать РЕАЛЬНУЮ роль пользователя из БД
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decodedToken = JSON.parse(jsonPayload);
            const userRole = decodedToken.role; // Получаем строго 'EMPLOYER' или 'SEEKER'

            if (!userRole) {
                throw new Error("Роль пользователя не найдена внутри JWT-токена.");
            }

            const cleanRole = userRole ? userRole.toUpperCase() : '';

            // Сохраняем её в localStorage тоже в верхнем регистре, чтобы ProtectedRoute не ругался
            localStorage.setItem('role', cleanRole);

            // 3. Перенаправление исключительно по роли (теперь без багов с регистром)
            if (cleanRole === 'EMPLOYER') {
                console.log("Успешный вход! Направление работодателя на /employer");
                navigate('/employer');
            } else if (cleanRole === 'SEEKER') {
                console.log("Успешный вход! Направление соискателя на /dashboard");
                navigate('/dashboard');
            } else {
                throw new Error(`Неизвестная роль в системе: ${userRole}`);
            }

        } catch (err) {
            console.error("Критическая ошибка при авторизации на фронтенде:", err);
            setError(err.response?.data?.detail || err.message || 'Произошла ошибка при обработке входа.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial' }}>
            <h2>Вход в платформу</h2>
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="email-input" style={{ display: 'block', fontWeight: 'bold' }}>Email:</label>
                    <input
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="example@mail.com"
                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="password-input" style={{ display: 'block', fontWeight: 'bold' }}>Пароль:</label>
                    <input
                        id="password-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                    Войти
                </button>
            </form>
            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                Нет аккаунта? <a href="/register" style={{ color: '#007BFF', textDecoration: 'none' }}>Зарегистрироваться</a>
            </p>
        </div>
    );
};

export default Login;