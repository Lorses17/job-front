import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem('token');

    return (
        <div style={{
            backgroundColor: '#0D111A',
            minHeight: '100vh',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#E2E8F0',
            position: 'relative',
            overflowX: 'hidden',
            width: '100%' // Растягиваем на всю ширину
        }}>

            {/* НЕОНОВЫЕ СВЕЧЕНИЯ НА ЗАДНЕМ ПЛАНЕ */}
            <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(0,123,255,0.12) 0%, rgba(0,0,0,0) 70%)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(138,43,226,0.08) 0%, rgba(0,0,0,0) 70%)', zIndex: 0, pointerEvents: 'none' }} />

            {/* ОСНОВНОЙ КОНТЕНЕР С ВЫРАВНИВАНИЕМ ПО ЦЕНТРУ */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', boxSizing: 'border-box' }}>

                {/* СТИЛЬНЫЙ БЭДЖ */}
                <div style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', fontSize: '13px', color: '#94A3B8', marginBottom: '24px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    🚀 Платформа нового поколения
                </div>

                {/* ЗАГОЛОВОК С ГРАДИЕНТОМ */}
                <h1 style={{ fontSize: '4.5rem', fontWeight: '800', letterSpacing: '-2px', background: 'linear-gradient(to right, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 24px 0', textAlign: 'center' }}>
                </h1>

                <p style={{ fontSize: '1.25rem', color: '#94A3B8', maxWidth: '700px', margin: '0 auto 40px auto', lineHeight: '1.6', textAlign: 'center' }}>
                    Пространство, где специалисты и аккредитованные компании находят друг друга без лишней бюрократии, посредников и долгих ожиданий со стороны HR.
                </p>

                {/* ДВЕ ГЛАВНЫЕ КНОПКИ ДЛЯ НАВИГАЦИИ */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '80px' }}>
                    <button
                        onClick={() => navigate('/vacancies')}
                        style={{
                            padding: '16px 32px',
                            fontSize: '16px',
                            background: 'linear-gradient(135deg, #007BFF 0%, #0056B3 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            boxShadow: '0 4px 20px rgba(0, 123, 255, 0.25)'
                        }}
                    >
                        🔍 Найти вакансию
                    </button>

                    <button
                        onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                        style={{
                            padding: '16px 32px',
                            fontSize: '16px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        {isAuthenticated ? 'В Личный кабинет ↗' : 'Личный кабинет'}
                    </button>
                </div>

                {/* ТРИ ПРЕИМУЩЕСТВА СНИЗУ (GLASSMORPHISM) */}
                <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                    {[
                        { title: '⚡ Прямой диалог', text: 'Интегрированная система чатов позволяет обсуждать технические детали вакансии напрямую с тимлидом.' },
                        { title: '💼 Умная ATS', text: 'Удобное разделение откликов для бизнеса. Отправляйте неподходящие заявки в архив в один клик.' },
                        { title: '☁️ Облако MinIO', text: 'Загружайте PDF-резюме напрямую в изолированное S3 хранилище с автоматическим обновлением путей.' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            background: 'rgba(30, 41, 59, 0.25)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            padding: '30px',
                            borderRadius: '12px',
                            flex: '1',
                            minWidth: '280px',
                            maxWidth: '340px',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)'
                        }}>
                            <h4 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>{item.title}</h4>
                            <p style={{ color: '#94A3B8', margin: '0', fontSize: '14px', lineHeight: '1.5' }}>{item.text}</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default Home;