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
    size?: "sm" | "md" | "lg" | "xl" | "full" | "xxl";
    className?: string;
    showCloseButton?: boolean;
    closeOnOutsideClick?: boolean;
}

const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    xxl: "sm:max-w-2xl",
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
    showCloseButton = true,
    closeOnOutsideClick = true,
}: ModalProps) => {
    const handleOpenChange = (open: boolean) => {
        if (!closeOnOutsideClick) {
            return;
        }

        if (!open) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className={cn(sizeClasses[size], className)} showCloseButton={showCloseButton}>
                {(title || description) && (
                    <DialogHeader className="-m-4 mb-4 rounded-t-lg bg-brand-purple p-4 pr-10 text-white sm:-m-6 sm:mb-6">
                        {title && <DialogTitle className="text-white">{title}</DialogTitle>}
                        {description && (
                            <DialogDescription className="text-white/90">{description}</DialogDescription>
                        )}
                    </DialogHeader>
                )}
                <div className="min-h-0 overflow-y-auto overscroll-contain pr-1">{children}</div>
            </DialogContent>
        </Dialog>
    );
};
