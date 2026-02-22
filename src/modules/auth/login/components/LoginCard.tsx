import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { User, Lock, Shield, Activity, Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginTypeSelector } from "./LoginTypeSelector";
import { UseLogin } from "../hooks/use-login";

interface LoginCardProps {
    isPatient: boolean;
    onTypeChange: (isPatient: boolean) => void;
}

const loginSchema = z.object({
    username: z.string().min(1, {
        message: "Este campo es requerido",
    }),
    password: z.string().min(1, {
        message: "La contraseña es requerida",
    }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginCard = ({ isPatient, onTypeChange }: LoginCardProps) => {
    const [rememberMe, setRememberMe] = useState(false);
    const mutation = UseLogin();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const onSubmit = (values: LoginFormValues) => {
        mutation.mutate({
            username: values.username.trim(),
            password: values.password,
            user_type: isPatient ? "patient" : "staff",
        });
    };

    return (
        <div className={cn(
            "w-full max-w-md p-8 rounded-3xl shadow-card transition-theme login-card-entry",
            "bg-card/95 backdrop-blur-xl border border-border/50"
        )}>
            <div className="mb-8 animate-slide-up">
                <h2 className={cn(
                    "font-display text-4xl font-bold tracking-tight transition-colors duration-500 text-center",
                    isPatient ? "text-teal-700" : "text-brand-purple"
                )}>
                    Next<span className={cn(
                        "transition-colors duration-500",
                        isPatient ? "text-cyan-600" : "text-indigo-400"
                    )}>RIS</span>
                </h2>
                <p className={cn(
                    "text-center text-sm mt-1 transition-colors duration-500",
                    isPatient ? "text-teal-600/70" : "text-brand-purple/70"
                )}>
                    Sistema de Información Radiológica
                </p>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                    {isPatient ? "Portal del Paciente" : "Portal Médico"}
                </h1>
                <p className="text-muted-foreground text-sm">
                    {isPatient
                        ? "Acceda a sus consultas y resultados médicos"
                        : "Sistema de gestión clínica NextRIS"}
                </p>
            </div>

            {/* Type Selector */}
            <div className="mb-6">
                <LoginTypeSelector isPatient={isPatient} onTypeChange={onTypeChange} />
            </div>

            {/* Form */}
            <Form {...form}>
                <form
                    className="space-y-5"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                                                {isPatient ? <User className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
                                            </div>
                                            <Input
                                                type="text"
                                                placeholder={isPatient ? "Número de documento" : "Usuario médico"}
                                                className="pl-12"
                                                disabled={mutation.isLoading}
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <Input
                                                type="password"
                                                placeholder="Contraseña"
                                                className="pl-12"
                                                disabled={mutation.isLoading}
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Options */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            />
                            <label
                                htmlFor="remember"
                                className="text-sm text-muted-foreground cursor-pointer"
                            >
                                Recordarme
                            </label>
                        </div>
                        <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="text-sm text-primary hover:underline transition-colors"
                        >
                            ¿Olvidó su contraseña?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        variant="default"
                        className={cn(
                            "w-full transition-all duration-300",
                            isPatient
                                ? "bg-cyan-600 hover:bg-cyan-600 text-white"
                                : "bg-brand-purple hover:bg-brand-purple text-white"
                        )}
                    >
                        {mutation.isLoading ? (
                            <>Iniciando sesión...</>
                        ) : isPatient ? (
                            <>
                                <Activity className="w-5 h-5" />
                                Acceder a Mi Salud
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                Ingresar al Sistema
                            </>
                        )}
                    </Button>
                </form>
            </Form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <p className="text-xs text-muted-foreground">
                    {isPatient
                        ? "Sus datos están protegidos bajo la ley de protección de datos de salud"
                        : "Acceso restringido a personal autorizado"}
                </p>
            </div>
        </div>
    );
};
