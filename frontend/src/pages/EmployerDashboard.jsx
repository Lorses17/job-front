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
    const [activeChatAppId, setActiveChatAppId] = useState(null); // ID отклика, для которого открыт чат
    const [chatMessages, setChatMessages] = useState([]);         // Сообщения текущего чата
    const [newMessageText, setNewMessageText] = useState('');     // Текст нового сообщения

    // Навигация по вкладкам кабинета: 'profile', 'create_vacancy', 'my_vacancies', 'applications'
    const [activeTab, setActiveTab] = useState('profile');

    // Состояния для вакансии
    const [vacancyTitle, setVacancyTitle] = useState('');
    const [vacancyCity, setVacancyCity] = useState('');
    const [salaryMin, setSalaryMin] = useState('');
    const [salaryMax, setSalaryMax] = useState('');
    const [vacancySkills, setVacancySkills] = useState(''); // Для строки навыков через запятую

    // Списки для вакансий и откликов
    const [myVacancies, setMyVacancies] = useState([]);
    const [applications, setApplications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const [activeResumeId, setActiveResumeId] = useState(null); // ID резюме, которое сейчас просматривают
    const [resumeData, setResumeData] = useState(null);         // Данные загруженного резюме
    // --- ЭФФЕКТЫ ---

    const fetchCompanyData = async () => {
        try {
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

    useEffect(() => {
        fetchCompanyData();
    }, []);

// Подгрузка вакансий и откликов при переключении вкладок
    useEffect(() => {
        if (!hasCompany) return;

        if (activeTab === 'my_vacancies') {
            API.get('/jobs/company/my/vacancies')
                .then(res => {
                    // ОТЛАДКА: смотрим в консоль браузера
                    console.log("ВАКАНСИИ МОЕЙ КОМПАНИИ:", res.data);
                    setMyVacancies(res.data);
                })
                .catch(err => {
                    console.error("Ошибка при получении вакансий компании:", err);
                });
        }

        if (activeTab === 'applications' || activeTab === 'archive') {
            API.get('/applications/incoming')
                .then(res => setApplications(res.data))
                .catch(err => console.error(err));
        }
    }, [activeTab, hasCompany]);

    // Живое автообновление чата у работодателя каждые 3 секунды
    useEffect(() => {
        if (!activeChatAppId) return;

        const updateChat = () => {
            API.get(`/chats/${activeChatAppId}`)
                .then(res => setChatMessages(res.data))
                .catch(err => console.error(err));
        };

        updateChat(); // Обновляем мгновенно при открытии
        const interval = setInterval(updateChat, 3000);

        return () => clearInterval(interval); // Очищаем таймер при закрытии чата
    }, [activeChatAppId]);

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

    const handleSaveCompany = async (e) => {
        e.preventDefault();
        try {
            await API.post('/jobs/company', {
                name: companyName,
                description: description
            });
            setMessage('Профиль компании успешно сохранен!');
            setHasCompany(true);
            setIsEditing(false);
        } catch (err) {
            setMessage('Ошибка при сохранении компании.');
        }
    };

    const handleCreateVacancy = async (e) => {
        e.preventDefault();
        try {
            const skillsArray = vacancySkills
                ? vacancySkills.split(',').map(s => s.trim()).filter(Boolean)
                : [];

            await API.post('/jobs/vacancies', {
                title: vacancyTitle,
                city: vacancyCity,
                salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
                salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
                skills: skillsArray,
                status: "active"
            });

            setMessage('Вакансия успешно опубликована!');
            setVacancyTitle('');
            setVacancyCity('');
            setSalaryMin('');
            setSalaryMax('');
            setVacancySkills('');
            setActiveTab('my_vacancies');
        } catch (err) {
            console.error(err);
            setMessage('Ошибка при создании вакансии.');
        }
    };

    const handleOpenChat = async (appId) => {
        // Переключаем: если чат открыт — закрываем (null), иначе открываем этот ID
        setActiveChatAppId(activeChatAppId === appId ? null : appId);
        try {
            const res = await API.get(`/chats/${appId}`);
            setChatMessages(res.data);
        } catch (err) {
            console.error("Ошибка при загрузке чата:", err);
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
            console.error("Ошибка при отправке сообщения:", err);
        }
    };

    const handleRejectApplication = async (appId) => {
        if (!window.confirm('Вы уверены, что хотите отказать этому соискателю?')) return;

        try {
            // Отправляем PATCH запрос на бэкенд для обновления статуса
            // Проверь, как точно называется статус отказа в твоем ApplicationStatus (обычно 'rejected')
            const response = await API.patch(`/applications/${appId}/status`, {
                status: 'rejected'
            });

            // Обновляем статус локально в списке откликов, чтобы интерфейс сразу перерисовывался
            setApplications(prevApps =>
                prevApps.map(app => app.id === appId ? { ...app, status: response.data.status } : app)
            );

            alert('Статус отклика изменен на "Отклонено"');
        } catch (err) {
            console.error("Ошибка при изменении статуса:", err);
            alert('Не удалось изменить статус отклика.');
        }
    };
    const handleOpenResume = async (resumeId) => {
        // Если это резюме уже открыто, то при повторном клике закрываем его
        if (activeResumeId === resumeId) {
            setActiveResumeId(null);
            setResumeData(null);
            return;
        }

        setActiveResumeId(resumeId);
        setResumeData(null); // Сбрасываем старые данные перед загрузкой новых

        try {
            // Меняй путь '/resumes/' на тот, который настроен у тебя на бэкенде
            const res = await API.get(`/resumes/${resumeId}`);
            setResumeData(res.data);
        } catch (err) {
            console.error("Ошибка при загрузке резюме:", err);
            alert("Не удалось загрузить данные резюме.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка кабинета...</p>;

    return (
        <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '20px', fontFamily: 'Arial' }}>
            {/* ШАПКА КАБИНЕТА */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
                <h2>Панель Работодателя {hasCompany && `— ${companyName}`}</h2>
                <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#DC3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Выйти
                </button>
            </div>

            {message && <p style={{ color: 'green', fontWeight: 'bold', marginTop: '10px' }}>{message}</p>}

            {/* МЕНЮ ВКЛАДОК */}
            {hasCompany && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '20px' }}>
                    <button onClick={() => { setActiveTab('profile'); setMessage(''); }} style={{ padding: '10px 15px', backgroundColor: activeTab === 'profile' ? '#007BFF' : '#E2E6EA', color: activeTab === 'profile' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Профиль компании</button>
                    <button onClick={() => { setActiveTab('create_vacancy'); setMessage(''); }} style={{ padding: '10px 15px', backgroundColor: activeTab === 'create_vacancy' ? '#007BFF' : '#E2E6EA', color: activeTab === 'create_vacancy' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>➕ Создать вакансию</button>
                    <button onClick={() => { setActiveTab('my_vacancies'); setMessage(''); }} style={{ padding: '10px 15px', backgroundColor: activeTab === 'my_vacancies' ? '#007BFF' : '#E2E6EA', color: activeTab === 'my_vacancies' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📋 Мои вакансии</button>
                    <button onClick={() => { setActiveTab('applications'); setMessage(''); }} style={{ padding: '10px 15px', backgroundColor: activeTab === 'applications' ? '#007BFF' : '#E2E6EA', color: activeTab === 'applications' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📨 Отклики соискателей</button>
                    <button onClick={() => { setActiveTab('archive'); setMessage(''); }} style={{ padding: '10px 15px', backgroundColor: activeTab === 'archive' ? '#6C757D' : '#E2E6EA', color: activeTab === 'archive' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📁 Архив</button>
                </div>
            )}

            {/* ВКЛАДКА 1: ПРОФИЛЬ КОМПАНИИ */}
            {activeTab === 'profile' && (
                <div>
                    {!hasCompany && !isEditing ? (
                        <div style={{ marginTop: '20px', padding: '30px', border: '1px dashed #ccc', textAlign: 'center', backgroundColor: '#fff' }}>
                            <p>У вас еще не зарегистрирована компания в системе.</p>
                            <button onClick={() => setIsEditing(true)} style={{ padding: '10px 20px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                🏢 Зарегистрировать компанию
                            </button>
                        </div>
                    ) : isEditing ? (
                        <form onSubmit={handleSaveCompany} style={{ padding: '20px', backgroundColor: '#F8F9FA', borderRadius: '6px' }}>
                            <h3>Информация о компании</h3>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Название компании:</label>
                                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Описание деятельности:</label>
                                <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                            </div>
                            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Сохранить профиль</button>
                            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', backgroundColor: '#6C757D', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '10px', cursor: 'pointer' }}>Отмена</button>
                        </form>
                    ) : (
                        <div style={{ padding: '20px', backgroundColor: '#FFF', border: '1px solid #ddd', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h3>{companyName}</h3>
                                <button onClick={() => setIsEditing(true)} style={{ padding: '8px 15px', backgroundColor: '#FFC107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Редактировать профиль</button>
                            </div>
                            <p style={{ color: '#555', whiteSpace: 'pre-wrap', marginTop: '15px' }}>{description}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ВКЛАДКА 2: СОЗДАНИЕ ВАКАНСИИ */}
            {activeTab === 'create_vacancy' && (
                <form onSubmit={handleCreateVacancy} style={{ padding: '20px', backgroundColor: '#F8F9FA', borderRadius: '6px' }}>
                    <h3>Новая вакансия</h3>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Название должности:</label>
                        <input type="text" value={vacancyTitle} onChange={(e) => setVacancyTitle(e.target.value)} required placeholder="Например: Python Developer" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Город:</label>
                        <input type="text" value={vacancyCity} onChange={(e) => setVacancyCity(e.target.value)} required placeholder="Например: Москва" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Зарплата от (руб):</label>
                            <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="80000" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Зарплата до (руб):</label>
                            <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="150000" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Ключевые навыки (через запятую):</label>
                        <input type="text" value={vacancySkills} onChange={(e) => setVacancySkills(e.target.value)} placeholder="Python, FastAPI, PostgreSQL, Git" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    </div>
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚀 Опубликовать вакансию</button>
                </form>
            )}

            {/* ВКЛАДКА 3: МОИ ВАКАНСИИ */}
            {activeTab === 'my_vacancies' && (
                <div>
                    <h3>Размещенные вакансии</h3>
                    {myVacancies.length === 0 ? (
                        <p style={{ color: '#666' }}>Вы еще не опубликовали ни одной вакансии.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {myVacancies.map((vac) => {
                                // Логика форматирования зарплаты из полей БД
                                let salaryText = 'По договоренности';
                                if (vac.salary_min && vac.salary_max) {
                                    salaryText = `${vac.salary_min} – ${vac.salary_max} руб.`;
                                } else if (vac.salary_min) {
                                    salaryText = `от ${vac.salary_min} руб.`;
                                } else if (vac.salary_max) {
                                    salaryText = `до ${vac.salary_max} руб.`;
                                }

                                return (
                                    <div key={vac.id} style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#007BFF' }}>{vac.title}</h4>
                                        <p style={{ margin: '0 0 5px 0' }}><b>Город:</b> {vac.city || 'Не указан'}</p>

                                        {/* Выводим сформированный текст зарплаты */}
                                        <p style={{ margin: '0 0 10px 0' }}><b>Зарплата:</b> {salaryText}</p>

                                        {/* Если у вакансии есть навыки, выведем и их для красоты */}
                                        {vac.skills && vac.skills.length > 0 && (
                                            <p style={{ margin: '0 0 10px 0', fontSize: '13px' }}>
                                                <b>Навыки:</b> {vac.skills.join(', ')}
                                            </p>
                                        )}
                                        <p style={{ color: '#444', fontSize: '14px', whiteSpace: 'pre-wrap', margin: '0' }}>{vac.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ВКЛАДКА 4: ТОЛЬКО АКТИВНЫЕ ОТКЛИКИ */}
            {activeTab === 'applications' && (
                <div>
                    <h3>Входящие отклики соискателей (Активные)</h3>
                    {applications.filter(app => app.status !== 'rejected').length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Нет новых активных откликов.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {applications.filter(app => app.status !== 'rejected').map((app) => {
                                const isChatOpen = activeChatAppId === app.id;
                                return (
                                    <div key={app.id} style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff', borderLeft: '5px solid #28A745' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 5px 0' }}>Отклик №{app.id}</h4>
                                                <p style={{ margin: '0 0 5px 0' }}><b>ID Вакансии:</b> {app.vacancy_id}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><b>ID Резюме соискателя:</b> {app.resume_id}</p>
                                                <p style={{ margin: '0' }}><b>Текущий статус:</b> <span style={{ color: '#FFC107', fontWeight: 'bold' }}>{app.status}</span></p>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => handleOpenResume(app.resume_id)}
                                                    style={{ padding: '8px 12px', backgroundColor: activeResumeId === app.resume_id ? '#DC3545' : '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    {activeResumeId === app.resume_id ? '❌ Закрыть резюме' : '📄 Посмотреть резюме'}
                                                </button>
                                                <button onClick={() => handleOpenChat(app.id)} style={{ padding: '8px 12px', backgroundColor: isChatOpen ? '#DC3545' : '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    {isChatOpen ? '❌ Закрыть' : '💬 Связаться'}
                                                </button>
                                                <button onClick={() => handleRejectApplication(app.id)} style={{ padding: '8px 12px', backgroundColor: '#6C757D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    🙅‍♂️ Отказать
                                                </button>
                                            </div>
                                        </div>

                                        {/* ИНТЕРФЕЙС ЧАТА ДЛЯ АКТИВНЫХ */}
                                        {isChatOpen && (
                                            <div style={{ marginTop: '15px', padding: '15px', borderTop: '1px solid #eee', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                                <div style={{ height: '180px', overflowY: 'auto', backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}>
                                                    {chatMessages.length === 0 ? (
                                                        <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', marginTop: '10px' }}>Сообщений нет. Напишите первым!</p>
                                                    ) : (
                                                        chatMessages.map((msg) => {
                                                            const isMe = String(msg.sender_role).trim() === 'employer';
                                                            return (
                                                                <div key={msg.id} style={{ width: '100%', display: 'block', textAlign: isMe ? 'right' : 'left', marginBottom: '10px' }}>
                                                        <span style={{ display: 'inline-block', padding: '8px 14px', borderRadius: '12px', backgroundColor: isMe ? '#E2E6EA' : '#007BFF', color: isMe ? '#333' : '#FFF', fontSize: '13px', maxWidth: '70%', wordBreak: 'break-word', textAlign: 'left' }}>
                                                            {msg.text}
                                                        </span>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                                                    <input type="text" value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} placeholder="Введите сообщение..." style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                                    <button type="submit" style={{ padding: '10px 18px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Отправить</button>
                                                </form>
                                            </div>
                                        )}
                                        {/* ИНТЕРФЕЙС ПРОСМОТРА РЕЗЮМЕ */}
                                        {activeResumeId === app.resume_id && (
                                            <div style={{ marginTop: '15px', padding: '15px', borderTop: '1px solid #eee', backgroundColor: '#F1F3F5', borderRadius: '4px' }}>
                                                <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>Резюме соискателя (ID: {app.resume_id})</h5>
                                                {!resumeData ? (
                                                    <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>Загрузка данных резюме...</p>
                                                ) : (
                                                    <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                                                        <p style={{ margin: '0 0 8px 0' }}><b>Желаемая должность:</b> {resumeData.title || 'Не указана'}</p>
                                                        <p style={{ margin: '0 0 8px 0' }}><b>Город проживания:</b> {resumeData.city || 'Не указан'}</p>

                                                        {resumeData.skills && resumeData.skills.length > 0 && (
                                                            <p style={{ margin: '0 0 8px 0' }}>
                                                                <b>Навыки:</b> {Array.isArray(resumeData.skills) ? resumeData.skills.join(', ') : resumeData.skills}
                                                            </p>
                                                        )}

                                                        {/* ИСПРАВЛЕНО: Теперь берем данные из .text вместо .description */}
                                                        <p style={{ margin: '0 0 15px 0', whiteSpace: 'pre-wrap' }}>
                                                            <b>О себе / Опыт работы:</b><br/>
                                                            {resumeData.text || 'Описание отсутствует'}
                                                        </p>

                                                        {/* БЛОК ИНТЕГРИРОВАННОГО ПРОСМОТРА PDF ФАЙЛА С АЛЬТЕРНАТИВНЫМ ПЛЕЕРОМ */}
                                                        {resumeData.file_url ? (
                                                            <div style={{ borderTop: '1px dashed #ddd', paddingTop: '15px', marginTop: '10px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                    <b>📄 Прикрепленный PDF-файл:</b>

                                                                    <a
                                                                        href={resumeData.file_url}
                                                                        download={`Resume_ID_${app.resume_id}.pdf`}
                                                                        style={{
                                                                            color: '#FFF',
                                                                            backgroundColor: '#17A2B8',
                                                                            padding: '5px 10px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '13px',
                                                                            textDecoration: 'none',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >
                                                                        📥 Скачать резюме
                                                                    </a>
                                                                </div>

                                                                {/* ИСПОЛЬЗУЕМ GOOGLE VIEWER КАК ПЛЕЕР ДЛЯ PDF ВНУТРИ IFRAME */}
                                                                <iframe
                                                                    src={`https://docs.google.com/gview?url=${encodeURIComponent(resumeData.file_url)}&embedded=true`}
                                                                    title="Просмотр резюме"
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '600px',
                                                                        border: '1px solid #ccc',
                                                                        borderRadius: '4px',
                                                                        backgroundColor: '#fafafa'
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <p style={{ fontSize: '12px', color: '#999', margin: '10px 0 0 0', fontStyle: 'italic' }}>
                                                                📎 Файл к резюме не прикреплен
                                                            </p>
                                                        )}
                                                    </div>
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

            {/* ВЫДЕЛЕННАЯ ВКЛАДКА 5: АРХИВ */}
            {activeTab === 'archive' && (
                <div>
                    <h3>📁 Архив (Отклоненные отклики)</h3>
                    {applications.filter(app => app.status === 'rejected').length === 0 ? (
                        <p style={{ color: '#999', fontStyle: 'italic' }}>Архив пуст.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {applications.filter(app => app.status === 'rejected').map((app) => {
                                const isChatOpen = activeChatAppId === app.id;
                                return (
                                    <div key={app.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#F8F9FA', borderLeft: '5px solid #DC3545' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 5px 0', color: '#6C757D' }}>Отклик №{app.id}</h4>
                                                <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}><b>ID Вакансии:</b> {app.vacancy_id} | <b>ID Резюме:</b> {app.resume_id}</p>
                                                <p style={{ margin: '0', fontSize: '13px' }}><b>Статус:</b> <span style={{ color: '#DC3545', fontWeight: 'bold' }}>{app.status}</span></p>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => handleOpenChat(app.id)} style={{ padding: '8px 14px', backgroundColor: isChatOpen ? '#DC3545' : '#6C757D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    {isChatOpen ? '❌ Закрыть чат' : '📜 Посмотреть переписку'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* ЧАТ ВНУТРИ АРХИВА (Только чтение истории) */}
                                        {isChatOpen && (
                                            <div style={{ marginTop: '15px', padding: '15px', borderTop: '1px solid #eee', backgroundColor: '#fff', borderRadius: '4px' }}>
                                                <h5>История переписки по отклику №{app.id}</h5>
                                                <div style={{ height: '180px', overflowY: 'auto', backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                                                    {chatMessages.length === 0 ? (
                                                        <p style={{ color: '#999', fontSize: '13px', textAlign: 'center' }}>История сообщений пуста.</p>
                                                    ) : (
                                                        chatMessages.map((msg) => {
                                                            const isMe = String(msg.sender_role).trim() === 'employer';
                                                            return (
                                                                <div key={msg.id} style={{ width: '100%', display: 'block', textAlign: isMe ? 'right' : 'left', marginBottom: '10px' }}>
                                                        <span style={{ display: 'inline-block', padding: '8px 14px', borderRadius: '12px', backgroundColor: isMe ? '#E2E6EA' : '#007BFF', color: isMe ? '#333' : '#FFF', fontSize: '13px', maxWidth: '70%', wordBreak: 'break-word', textAlign: 'left' }}>
                                                            {msg.text}
                                                        </span>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployerDashboard;