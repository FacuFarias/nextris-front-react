import { api } from '@/lib/api';

export const getPatientDomains = async ({ userId }: { userId: string }) => {
    try {
        const response = await api.get(`/auth/user/${userId}/patientdomains`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
