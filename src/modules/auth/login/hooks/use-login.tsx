import { useMutation } from "@tanstack/react-query"
import { login } from "../services/login.service"
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: {
        email: string;
        email_verification_required?: boolean;
        email_verified?: boolean;
        facility_id?: string | null;
        id: string;
        location_id?: string | null;
        name: string;
        requires_password_change: boolean;
        role_id: string;
        surname: string;
        user_type: string;
        username: string;
    };
    message: string;
    success: boolean;
}

export const UseLogin = () => {
    const navigate = useNavigate();
    const { login: loginContext } = useAuth();

    const mutation = useMutation<LoginResponse, Error, { username: string; password: string; user_type: string }>({
        mutationFn: ({ username, password, user_type }: { username: string; password: string; user_type: string }) => login(username, password, user_type),
        onSuccess: async (data) => {
            loginContext(data);
            toast.success(data?.message || "¡Inicio de sesión exitoso!", {
                position: "top-right",
            });
            navigate(data?.user?.user_type === "patient" ? "/estudios" : "/inicio");
        },
        onError: (error) => {
            console.error("Error during login:", error);
            toast.error("Credenciales inválidas. Por favor, intenta de nuevo.", {
                duration: 4000,
                position: "top-right",
            });
        }
    })

    /*   const logoutMutation = useMutation({
          mutationFn: () => logout(),
          onSuccess: () => {
              navigate("/login");
          },
          onError: (error) => {
              console.error("Error during logout:", error);
              toast.error("Error al cerrar sesión. Por favor, intenta de nuevo.", {
                  duration: 4000,
                  position: "top-right",
              });
          }
      }); */

    return {
        mutate: mutation.mutate,
        isLoading: mutation.status === 'pending',
        isError: mutation.status === 'error',
        isSuccess: mutation.status === 'success',
        error: mutation.error,
    }
}
