import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; // Импортируем защитника
import Vacancies from './pages/Vacancies';
import EmployerDashboard from './pages/EmployerDashboard'; // Импорт панели работодателя
import Home from './pages/Home';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>

                    {/* Публичные маршруты */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Маршрут для Соискателя (SEEKER) */}
                    <Route
                        path="/dashboard"
                        element = {
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Маршрут для Работодателя (EMPLOYER) — Теперь он на своем месте! */}
                    <Route
                        path="/employer"
                        element = {
                            <ProtectedRoute>
                                <EmployerDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Общие защищенные маршруты (например, просмотр вакансий) */}
                    <Route
                        path="/vacancies"
                        element = {
                            <ProtectedRoute>
                                <Vacancies />
                            </ProtectedRoute>
                        }
                    />

                    {/* Дефолтный редирект. Если пользователь авторизован, ProtectedRoute
                        сам разберется, но если ввести несуществующий адрес, кинет на /login или /dashboard */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                    <Route path="/" element={<Home />} />
                </Routes>
                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark" /* Жестко задаем темную тему */
                />
            </div>
        </Router>
    );
}

export default App;