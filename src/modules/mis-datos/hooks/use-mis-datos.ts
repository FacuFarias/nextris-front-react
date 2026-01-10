import { useQuery } from "@tanstack/react-query";
import { misDatosService } from "../services/mis-datos.service";

export const useMisDatos = () => {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["patient-profile"],
        queryFn: () => misDatosService.getProfile(),
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    return {
        profile: data?.data,
        isLoading,
        isError,
        error,
        refetch,
    };
};
