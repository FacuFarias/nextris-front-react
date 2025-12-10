import { getLocationsInstitutional } from "@/services/institutional-locations.service";
import { useQuery } from "@tanstack/react-query";

export const useLocationsInstitutional = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['locations-institutional'],
        queryFn: () => getLocationsInstitutional(),
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
    return { data, isLoading };
}
