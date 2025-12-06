import { api } from '@/lib/api';



export const login = async (username: string, password: string, user_type: string) => {
    try {
        const response = await api.post(`/auth/login`, {
            username,
            password,
            user_type
        });
        return response.data?.data;
    } catch (error) {
        throw error;
    }
};

/* export const logout = async () => {
    try {
        const response = await api.post(`/auth/logout`);
        return response.data?.data;
    } catch (error) {
        throw error;
    }
}; */