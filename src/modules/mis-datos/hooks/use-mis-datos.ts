import { useQuery } from "@tanstack/react-query";
import { misDatosService } from "../services/mis-datos.service";
import { useAuth } from "@/context/AuthContext";

export const useMisDatos = () => {
    const { authData } = useAuth();
    const userId = authData?.user?.id ?? "anonymous";

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["patient-profile", userId],
        queryFn: () => misDatosService.getProfile(),
        staleTime: 1000 * 60 * 5,
    });

    return {
        profile: data?.data,
        isLoading,
        isError,
        error,
        refetch,
    };
};
