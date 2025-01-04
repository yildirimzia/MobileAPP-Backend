import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    withCredentials: true
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Eğer 401 hatası alırsak ve bu ilk denememizse
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Token'ı yenile
                await api.get('/refresh');

                // Önceki isteği tekrar et
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh başarısız olursa kullanıcıyı logout yap
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api; 