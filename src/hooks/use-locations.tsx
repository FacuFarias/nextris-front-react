import { getLocationsInstitutional } from "@/services/institutional-locations.service";
import { useQuery } from "@tanstack/react-query";
import { locationsKeys } from "@/constants/query-keys";

export const useLocationsInstitutional = () => {
    const { data, isLoading } = useQuery({
        queryKey: locationsKeys.institutional(),
        queryFn: () => getLocationsInstitutional(),
    });
    return { data, isLoading };
}
