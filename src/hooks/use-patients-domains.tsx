import { useAuth } from "@/context/AuthContext";
import { getPatientDomains } from "@/services/patient-domains.service";
import { useQuery } from "@tanstack/react-query";

export const usePatientsDomains = () => {
    const { authData } = useAuth();
    const userId = authData?.user.id!;
    const { data, isLoading } = useQuery({
        queryKey: ['patients-domains'],
        queryFn: () => getPatientDomains({ userId }),
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
    return { data, isLoading };
}
