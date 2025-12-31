import { api } from "@/lib/api"

export const getEjecucion = async () => {
    try {
        const response = await api.get(`/executions/orders`);
        return response.data;
    } catch (error) {
        throw error;
    }
}