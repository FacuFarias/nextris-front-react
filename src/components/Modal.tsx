import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    className?: string;
}

const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    full: "sm:max-w-full",
};

export const Modal = ({
    isOpen,
    onClose,
    children,
    title,
    description,
    size = "md",
    className,
}: ModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(sizeClasses[size], className)}>
                {(title || description) && (
                    <DialogHeader className="bg-brand-purple text-white p-4 rounded-t-lg -m-6 mb-6">
                        {title && <DialogTitle className="text-white">{title}</DialogTitle>}
                        {description && (
                            <DialogDescription className="text-white/90">{description}</DialogDescription>
                        )}
                    </DialogHeader>
                )}
                <div>{children}</div>
            </DialogContent>
        </Dialog>
    );
};
