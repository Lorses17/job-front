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

    // Навигация по вкладкам кабинета: 'profile', 'create_vacancy', 'my_vacancies', 'applications'
    const [activeTab, setActiveTab] = useState('profile');

    // Состояния для создания новой вакансии
// Находим блок состояний для вакансии и заменяем на этот:
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
            // Если на бэкенде пока нет эндпоинта для получения только СВОИХ вакансий,
            // можно временно запрашивать общий список вакансий
            API.get('/jobs/vacancies')
                .then(res => setMyVacancies(res.data))
                .catch(err => console.error(err));
        }

        if (activeTab === 'applications') {
            // Стучимся на правильный эндпоинт откликов
            API.get('/applications/incoming')
                .then(res => {
                    console.log("Полученные отклики:", res.data); // Для отладки в консоли
                    setApplications(res.data);
                })
                .catch(err => console.error(err));
        }
    }, [activeTab, hasCompany]);

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
            // Превращаем строку "React, Node.js" в массив ["React", "Node.js"]
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
            // Очищаем форму
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

            {/* МЕНЮ ВКЛАДОК (Доступно, только если компания создана) */}
            {hasCompany && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '20px' }}>
                    <button onClick={() => { setActiveTab('profile'); setMessage(''); }} style={{ padding: '10px 15px', backgroundColor: activeTab === 'profile' ? '#007BFF' : '#E2E6EA', color: activeTab === 'profile' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Профиль компании</button>
                    <button onClick={() => { setActiveTab('create_vacancy'); setMessage(''); }} style={{ padding: '10px 15px', backgroundColor: activeTab === 'create_vacancy' ? '#007BFF' : '#E2E6EA', color: activeTab === 'create_vacancy' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>➕ Создать вакансию</button>
                    <button onClick={() => { setActiveTab('my_vacancies'); setMessage(''); }} style={{ padding: '10px 15px', backgroundColor: activeTab === 'my_vacancies' ? '#007BFF' : '#E2E6EA', color: activeTab === 'my_vacancies' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📋 Мои вакансии</button>
                    <button onClick={() => { setActiveTab('applications'); setMessage(''); }} style={{ padding: '10px 15px', backgroundColor: activeTab === 'applications' ? '#007BFF' : '#E2E6EA', color: activeTab === 'applications' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📨 Отклики соискателей</button>
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
                            {myVacancies.map((vac) => (
                                <div key={vac.id} style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#007BFF' }}>{vac.title}</h4>
                                    <p style={{ margin: '0 0 5px 0' }}><b>Город:</b> {vac.city || 'Не указан'}</p>
                                    <p style={{ margin: '0 0 10px 0' }}><b>Зарплата:</b> {vac.salary || 'По договоренности'}</p>
                                    <p style={{ color: '#444', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{vac.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ВКЛАДКА 4: ОТКЛИКИ СОИСКАТЕЛЕЙ */}
            {activeTab === 'applications' && (
                <div>
                    <h3>Входящие отклики соискателей</h3>
                    {applications.length === 0 ? (
                        <p style={{ color: '#666' }}>Откликов на ваши вакансии пока нет.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {applications.map((app) => (
                                <div key={app.id} style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff', borderLeft: '5px solid #28A745' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 5px 0' }}>Отклик №{app.id}</h4>
                                            <p style={{ margin: '0 0 5px 0' }}><b>ID Вакансии:</b> {app.vacancy_id}</p>
                                            <p style={{ margin: '0 0 5px 0' }}><b>ID Резюме соискателя:</b> {app.resume_id}</p>
                                            <p style={{ margin: '0' }}><b>Текущий статус:</b> <span style={{ color: app.status === 'pending' ? '#FFC107' : '#28A745', fontWeight: 'bold' }}>{app.status}</span></p>
                                        </div>

                                        {/* Кнопка действия (например, для будущего изменения статуса) */}
                                        <button style={{ padding: '8px 12px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                            Посмотреть резюме
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployerDashboard;