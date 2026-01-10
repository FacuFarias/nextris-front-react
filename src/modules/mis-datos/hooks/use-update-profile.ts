import { useMutation, useQueryClient } from "@tanstack/react-query";
import { misDatosService } from "../services/mis-datos.service";
import type { UpdateProfilePayload } from "../types";

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateProfilePayload) =>
            misDatosService.updateProfile(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
        },
    });
};
