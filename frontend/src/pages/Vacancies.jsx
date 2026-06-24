import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const Vacancies = () => {
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [appliedIds, setAppliedIds] = useState(new Set()); // Храним ID вакансий, на которые уже откликнулись

    useEffect(() => {
        const fetchVacancies = async () => {
            try {
                const response = await API.get('/jobs/vacancies');
                setVacancies(response.data);
            } catch (err) {
                setError('Не удалось загрузить список вакансий.');
            } finally {
                setLoading(false);
            }
        };

        fetchVacancies();
    }, []);

    const handleApply = async (vacancyId) => {
        try {
            // Отправляем POST-запрос на создание отклика
            await API.post('/applications/', {
                vacancy_id: vacancyId,
                resume_id: null // Бэкенд сам подставит дефолтное резюме юзера
            });

            // Добавляем ID вакансии в список успешных откликов
            setAppliedIds(prev => new Set(prev).add(vacancyId));
            alert('Отклик успешно отправлен!');
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при отправке отклика.');
        }
    };

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка вакансий...</p>;

    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', fontFamily: 'Arial' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Доступные вакансии</h2>
                <Link to="/dashboard" style={{ textDecoration: 'none', color: '#007BFF' }}>← В личный кабинет</Link>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {vacancies.length === 0 ? (
                <p>На данный момент нет активных вакансий.</p>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {vacancies.map((vacancy) => {
                        const hasApplied = appliedIds.has(vacancy.id);
                        return (
                            <div key={vacancy.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{vacancy.title}</h3>
                                <p style={{ margin: '5px 0', color: '#28A745', fontWeight: 'bold' }}>
                                    Зарплата: {vacancy.salary_min ? `от ${vacancy.salary_min}` : ''} {vacancy.salary_max ? `до ${vacancy.salary_max}` : ''} руб.
                                </p>
                                <p style={{ margin: '5px 0', color: '#666' }}><strong>Город:</strong> {vacancy.city}</p>
                                <div style={{ marginTop: '10px', marginBottom: '15px' }}>
                                    <strong>Навыки:</strong>{' '}
                                    {vacancy.skills.map((skill, index) => (
                                        <span key={index} style={{ display: 'inline-block', backgroundColor: '#E2E3E5', color: '#383D41', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', marginRight: '5px' }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleApply(vacancy.id)}
                                    disabled={hasApplied} // Отключаем кнопку, если уже откликнулись
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: hasApplied ? '#6C757D' : '#007BFF',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: hasApplied ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {hasApplied ? 'Вы откликнулись' : 'Откликнуться'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Vacancies;