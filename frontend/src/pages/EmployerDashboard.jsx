import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const EmployerDashboard = () => {
    const navigate = useNavigate();

    // Состояния для компании
    const [hasCompany, setHasCompany] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [description, setDescription] = useState('');

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                // Предполагаем эндпоинт получения своей компании на бэкенде
                const response = await API.get('/jobs/company/my');
                if (response.data) {
                    setCompanyName(response.data.name);
                    setDescription(response.data.description || '');
                    setHasCompany(true);
                }
            } catch (err) {
                if (err.response?.status === 404) {
                    setHasCompany(false);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, []);

    const handleSaveCompany = async (e) => {
        e.preventDefault();
        setMessage(''); // Очищаем старые сообщения перед отправкой

        // Валидация на фронтенде: имя не должно состоять только из пробелов
        if (!companyName.trim()) {
            setMessage('Ошибка: Название компании не может быть пустым.');
            return;
        }

        try {
            const companyData = {
                name: companyName.trim(),
                // Если описание пустое, передаем null, чтобы бэкенд не выдавал 400 ошибку
                description: description.trim() === '' ? null : description.trim()
            };

            await API.post('/jobs/company', companyData);

            setMessage('Профиль компании успешно сохранен!');
            setHasCompany(true);
            setIsEditing(false);
        } catch (err) {
            console.error("Ошибка при сохранении компании:", err);
            setMessage('Ошибка при сохранении компании. Проверьте заполнение полей.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка кабинета работодателя...</p>;

    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', fontFamily: 'Arial' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
                <h2>Панель Работодателя</h2>
                <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#DC3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Выйти
                </button>
            </div>

            {message && <p style={{ color: 'green', fontWeight: 'bold', marginTop: '10px' }}>{message}</p>}

            {/* ПРОФИЛЬ КОМПАНИИ */}
            {!hasCompany && !isEditing ? (
                <div style={{ marginTop: '20px', padding: '30px', border: '1px dashed #ccc', textAlign: 'center', backgroundColor: '#fff' }}>
                    <p>У вас еще не зарегистрирована компания в системе.</p>
                    <button onClick={() => setIsEditing(true)} style={{ padding: '10px 20px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        🏢 Зарегистрировать компанию
                    </button>
                </div>
            ) : isEditing ? (
                <form onSubmit={handleSaveCompany} style={{ marginTop: '20px', padding: '20px', backgroundColor: '#F8F9FA', borderRadius: '6px' }}>
                    <h3>Информация о компании</h3>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Название компании:</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Описание деятельности:</label>
                        <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px' }}>Сохранить</button>
                </form>
            ) : (
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#FFF', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3>{companyName}</h3>
                        <button onClick={() => setIsEditing(true)} style={{ padding: '5px 10px', backgroundColor: '#FFC107', border: 'none', borderRadius: '4px' }}>Редактировать</button>
                    </div>
                    <p style={{ color: '#666' }}>{description}</p>
                </div>
            )}
        </div>
    );
};

export default EmployerDashboard;