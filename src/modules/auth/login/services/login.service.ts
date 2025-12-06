import { api } from '@/lib/api';



export const login = async (username: string, password: string, user_type: string) => {
    try {
        const response = await api.post(`/auth/login`, {
            username,
            password,
            user_type
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};