import { useMutation } from "@tanstack/react-query"
import { login } from "../services/login.service"
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const UseLogin = () => {
    const navigate = useNavigate();

    const mutation = useMutation<{ token: string, message?: string }, Error, { username: string; password: string; user_type: string }>({
        mutationFn: ({ username, password, user_type }: { username: string; password: string; user_type: string }) => login(username, password, user_type),
        onSuccess: (data) => {
            toast.success(data?.message || "Login successful!");
            navigate("/inicio");
        },
        onError: (error) => {
            // Manejar errores de login
            console.error("Error during login:", error);
            toast.error("Credenciales inválidas. Por favor, intenta de nuevo.", {
                duration: 4000,
                position: "top-right",
            });
        }
    })

    return {
        mutate: mutation.mutate,
        isLoading: mutation.status === 'pending',
        isError: mutation.status === 'error',
        isSuccess: mutation.status === 'success',
        error: mutation.error,
    }
}
