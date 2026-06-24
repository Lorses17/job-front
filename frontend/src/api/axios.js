import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8010', // Убедись, что порт твой актуальный
});

// Добавление токена к запросам (оставляем)
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// !!! ЕСЛИ ЗДЕСЬ БЫЛ API.interceptors.response.use — ПОЛНОСТЬЮ УДАЛИ ИЛИ ЗАКОММЕНТИРУЙ ЕГО !!!

export default API;