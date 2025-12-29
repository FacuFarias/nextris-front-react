import { useAuth } from "@/context/AuthContext";
import { getPatientDomains } from "@/services/patient-domains.service";
import { useQuery } from "@tanstack/react-query";
import { patientDomainsKeys } from "@/constants/query-keys";

export const usePatientsDomains = () => {
    const { authData } = useAuth();
    const userId = authData?.user.id!;
    const { data, isLoading } = useQuery({
        queryKey: patientDomainsKeys.all,
        queryFn: () => getPatientDomains({ userId }),
    });
    return { data, isLoading };
}
