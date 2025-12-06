import { cn } from "@/lib/utils";
import { User, Stethoscope } from "lucide-react";

interface LoginTypeSelectorProps {
    isPatient: boolean;
    onTypeChange: (isPatient: boolean) => void;
}

export const LoginTypeSelector = ({ isPatient, onTypeChange }: LoginTypeSelectorProps) => {
    return (
        <div className="flex w-full rounded-xl bg-secondary/50 p-1.5 gap-1">
            <button
                type="button"
                onClick={() => onTypeChange(true)}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300",
                    isPatient
                        ? "bg-card text-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                <User className="w-5 h-5" />
                <span>Paciente</span>
            </button>
            <button
                type="button"
                onClick={() => onTypeChange(false)}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300",
                    !isPatient
                        ? "bg-card text-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Stethoscope className="w-5 h-5" />
                <span>Personal Médico</span>
            </button>
        </div>
    );
};
