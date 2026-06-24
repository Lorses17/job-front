import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const Dashboard = () => {
    const navigate = useNavigate();

    // === СОСТОЯНИЯ ПРОФИЛЯ ===
    const [hasResume, setHasResume] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [title, setTitle] = useState('');
    const [skills, setSkills] = useState('');
    const [experience, setExperience] = useState('');
    const [fileUrl, setFileUrl] = useState('');

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);

    // === СОСТОЯНИЯ ЧАТА И ОТКЛИКОВ ===
    const [myApplications, setMyApplications] = useState([]);
    const [activeChatAppId, setActiveChatAppId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessageText, setNewMessageText] = useState('');

    // === ЭФФЕКТЫ (LOGIC) ===

    // 1. Загрузка профиля резюме
    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const response = await API.get('/resumes/me');
            if (response.data) {
                setTitle(response.data.title);
                setSkills(response.data.skills.join(', '));
                setExperience(response.data.experience || '');
                setFileUrl(response.data.file_url || '');
                setHasResume(true);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setHasResume(false);
            } else if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // 2. Подгружаем отклики соискателя при старте
    useEffect(() => {
        API.get('/applications/my')
            .then(res => {
                console.log("Отклики соискателя:", res.data);
                setMyApplications(res.data);
            })
            .catch(err => console.error("Ошибка загрузки откликов соискателя:", err));
    }, []);

    // 3. Интервал живого обновления сообщений каждые 3 секунды (только если открыт чат)
    useEffect(() => {
        if (!activeChatAppId) return;

        const updateChat = () => {
            API.get(`/chats/${activeChatAppId}`)
                .then(res => setChatMessages(res.data))
                .catch(err => console.error(err));
        };

        updateChat(); // Обновляем сразу при клике
        const interval = setInterval(updateChat, 3000);

        return () => clearInterval(interval);
    }, [activeChatAppId]);


    // === ХЕНДЛЕРЫ КНОПОК И ФОРМ ===

    const handleOpenChat = async (appId) => {
        setActiveChatAppId(activeChatAppId === appId ? null : appId);
        try {
            const res = await API.get(`/chats/${appId}`);
            setChatMessages(res.data);
        } catch (err) {
            setChatMessages([]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessageText.trim()) return;

        try {
            const res = await API.post(`/chats/${activeChatAppId}`, {
                text: newMessageText
            });
            setChatMessages([...chatMessages, res.data]);
            setNewMessageText('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

            const response = await API.post('/resumes', {
                title,
                skills: skillsArray,
                experience
            });
            setMessage('Профиль успешно сохранен!');
            setFileUrl(response.data.file_url || '');
            setHasResume(true);
            setIsEditing(false);
            setIsCreating(false);
        } catch (err) {
            setMessage('Ошибка при сохранении профиля.');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Пожалуйста, выберите файл в формате PDF.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setMessage('');

        try {
            const response = await API.post('/resumes/upload-pdf', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFileUrl(response.data.file_url);
            setMessage('PDF-резюме успешно загружено!');
        } catch (err) {
            setMessage(err.response?.data?.detail || 'Ошибка при загрузке файла.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteProfile = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить свое резюме?')) return;

        try {
            await API.delete('/resumes/me');
            setTitle('');
            setSkills('');
            setExperience('');
            setFileUrl('');
            setHasResume(false);
            setIsEditing(false);
            setIsCreating(false);
            setMessage('Резюме успешно удалено.');
        } catch (err) {
            setMessage('Ошибка при удалении резюме.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка личного кабинета...</p>;


    // === ИНТЕРФЕЙС (RENDER) ===
    return (
        <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px', fontFamily: 'Arial' }}>

            {/* Хедер */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
                <h2>Личный кабинет соискателя</h2>
                <div>
                    <Link to="/vacancies" style={{ marginRight: '15px', padding: '8px 15px', backgroundColor: '#007BFF', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                        Посмотреть вакансии
                    </Link>
                    <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#DC3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Выйти
                    </button>
                </div>
            </div>

            {message && <p style={{ marginTop: '15px', color: message.includes('успешно') ? 'green' : 'red', fontWeight: 'bold' }}>{message}</p>}

            {/* СОСТОЯНИЕ 1: РЕЗЮМЕ ЕЩЕ НЕТ */}
            {!hasResume && !isCreating && !isEditing && (
                <div style={{ marginTop: '30px', textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <p style={{ color: '#666', fontSize: '18px', marginBottom: '20px' }}>У вас пока не создано профиля резюме.</p>
                    <button onClick={() => setIsCreating(true)} style={{ padding: '12px 25px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                        ➕ Создать резюме
                    </button>
                </div>
            )}

            {/* СОСТОЯНИЕ 2: ПРОСМОТР ГОТОВОГО РЕЗЮМЕ */}
            {hasResume && !isEditing && !isCreating && (
                <div style={{ marginTop: '30px', padding: '25px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#333', fontSize: '24px' }}>{title}</h3>
                        <div>
                            <button onClick={() => setIsEditing(true)} style={{ marginRight: '10px', padding: '6px 12px', backgroundColor: '#FFC107', color: '#212529', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Редактировать
                            </button>
                            <button onClick={handleDeleteProfile} style={{ padding: '6px 12px', backgroundColor: '#DC3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Удалить
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#555' }}>Навыки:</strong>
                        <div style={{ marginTop: '5px' }}>
                            {skills && skills.split(',').map((skill, idx) => (
                                <span key={idx} style={{ display: 'inline-block', backgroundColor: '#E2E3E5', color: '#383D41', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', marginRight: '6px', marginBottom: '5px' }}>
                                    {skill.trim()}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <strong style={{ color: '#555' }}>Опыт работы / О себе:</strong>
                        <p style={{ marginTop: '5px', whiteSpace: 'pre-line', color: '#444', lineHeight: '1.5', backgroundColor: '#F8F9FA', padding: '15px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                            {experience || 'Информация отсутствует'}
                        </p>
                    </div>

                    {/* БЛОК ЗАГРУЗКИ / ОТОБРАЖЕНИЯ PDF */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
                        <strong style={{ color: '#555', display: 'block', marginBottom: '8px' }}>Прикрепленный файл резюме (PDF):</strong>
                        {fileUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#E8F5E9', padding: '10px', borderRadius: '6px' }}>
                                <span style={{ fontSize: '20px' }}>📄</span>
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2E7D32', fontWeight: 'bold', textDecoration: 'none' }}>
                                    Открыть/Скачать ваше PDF-резюме
                                </a>
                                <label style={{ marginLeft: 'auto', backgroundColor: '#2196F3', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                    Обновить файл
                                    <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>
                            </div>
                        ) : (
                            <div style={{ padding: '15px', border: '2px dashed #ccc', borderRadius: '6px', textAlign: 'center', backgroundColor: '#FAFAFA' }}>
                                <p style={{ margin: '0 0 10px 0', color: '#777', fontSize: '14px' }}>Вы еще не прикрепили PDF-версию резюме для работодателей.</p>
                                <label style={{ display: 'inline-block', backgroundColor: '#007BFF', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {uploading ? 'Загрузка...' : '📎 Выбрать PDF-файл'}
                                    <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* БЛОК АКТИВНЫХ ДИАЛОГОВ (Отображается ВСЕГДА под резюме) */}
            {!isEditing && !isCreating && (
                <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#FFF', border: '1px solid #ddd', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <h3>Мои отклики и диалоги</h3>
                    {myApplications.length === 0 ? (
                        <p style={{ color: '#666' }}>Вы еще никуда не откликались.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {myApplications.map((app) => {
                                const isChatOpen = activeChatAppId === app.id;

                                return (
                                    <div key={app.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Отклик №{app.id}</span>
                                                <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>
                                                    Вакансия ID: {app.vacancy_id} | Статус: <span style={{ fontWeight: 'bold', color: '#28A745' }}>{app.status}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleOpenChat(app.id)}
                                                style={{ padding: '8px 14px', backgroundColor: isChatOpen ? '#DC3545' : '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                {isChatOpen ? '❌ Закрыть чат' : '💬 Чат с работодателем'}
                                            </button>
                                        </div>

                                        {/* ОКНО СООБЩЕНИЙ ВНУТРИ ВЫБРАННОГО ЧАТА */}
                                        {isChatOpen && (
                                            <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '6px', borderTop: '1px solid #eee' }}>
                                                <div style={{ height: '180px', overflowY: 'auto', backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}>
                                                    {chatMessages.length === 0 ? (
                                                        <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', marginTop: '10px' }}>Сообщений нет. Напишите работодателю!</p>
                                                    ) : (
                                                        chatMessages.map((msg) => {
                                                            // Важно: проверяем роль в верхнем регистре, как её отдаёт бэкенд
                                                            const isMe = String(msg.sender_role).trim() === 'seeker';

                                                            return (
                                                                <div key={msg.id} style={{
                                                                    marginBottom: '10px',
                                                                    textAlign: isMe ? 'right' : 'left',
                                                                    display: 'flex',
                                                                    justifyContent: isMe ? 'flex-end' : 'flex-start'
                                                                }}>
                                                                    <span style={{
                                                                        display: 'inline-block',
                                                                        padding: '8px 14px',
                                                                        borderRadius: '12px',
                                                                        // Свои сообщения (соискатель) — серые, чужие (работодатель) — синие
                                                                        backgroundColor: isMe ? '#E2E6EA' : '#007BFF',
                                                                        color: isMe ? '#333' : '#FFF',
                                                                        fontSize: '13px',
                                                                        maxWidth: '70%',
                                                                        wordBreak: 'break-word',
                                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                                    }}>
                {msg.text}
            </span>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>

                                                {/* Проверяем статус отклика. Если он равен 'rejected', блокируем отправку */}
                                                {app.status === 'rejected' ? (
                                                    <div style={{
                                                        padding: '10px',
                                                        backgroundColor: '#FFF3CD',
                                                        color: '#856404',
                                                        borderRadius: '4px',
                                                        textAlign: 'center',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold',
                                                        border: '1px solid #ffeeba'
                                                    }}>
                                                        🔒 Переписка по этому отклику завершена, так как заявка отклонена.
                                                    </div>
                                                ) : (
                                                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                                                        <input
                                                            type="text"
                                                            value={newMessageText}
                                                            onChange={(e) => setNewMessageText(e.target.value)}
                                                            placeholder="Напишите работодателю..."
                                                            style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        />
                                                        <button
                                                            type="submit"
                                                            style={{ padding: '6px 12px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Отправить
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* СОСТОЯНИЕ 3: ФОРМА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ РЕЗЮМЕ */}
            {(isEditing || isCreating) && (
                <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>{isEditing ? 'Редактирование резюме' : 'Новое резюме'}</h3>
                        <button onClick={() => { setIsEditing(false); setIsCreating(false); }} style={{ padding: '5px 10px', backgroundColor: '#6C757D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Отмена
                        </button>
                    </div>

                    <form onSubmit={handleSaveProfile}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Желаемая должность:</label>
                            <input type="text" placeholder="Например: Frontend Developer" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Ключевые навыки (через запятую):</label>
                            <input type="text" placeholder="JavaScript, React, HTML, CSS" value={skills} onChange={(e) => setSkills(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Опыт работы / О себе:</label>
                            <textarea rows="5" placeholder="Опишите ваши прошлые проекты..." value={experience} onChange={(e) => setExperience(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical' }} />
                        </div>
                        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                            {isEditing ? 'Сохранить изменения' : 'Создать профиль'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Dashboard;