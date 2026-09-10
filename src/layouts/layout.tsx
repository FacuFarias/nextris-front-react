import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import clinicaParqueLogo from "@/assets/logo/CLINICA PARQUE_LOGO.png";
import { useAuth } from "@/context/AuthContext";

interface MainLayoutProps {
    children: ReactNode;
    isOverflow?: boolean;
    mobileTitle?: string;
}

export const MainLayout = ({ children, isOverflow = true, mobileTitle = "NextRIS" }: MainLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // En escritorio la navegación comienza compacta para dejar más espacio al contenido.
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const { authData } = useAuth();
    const isPatientPortal = authData?.user?.user_type === "patient";

    useEffect(() => {
        if (!sidebarOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [sidebarOpen]);

    return (
        <div className={`flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-background ${isOverflow ? "h-dvh overflow-hidden" : ""}`}>
            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] items-center border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)] lg:hidden">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-accent"
                    aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={sidebarOpen}
                >
                    {sidebarOpen ? (
                        <X className="w-6 h-6 text-foreground" />
                    ) : (
                        <Menu className="w-6 h-6 text-foreground" />
                    )}
                </button>
                <div className="ml-4 truncate font-display text-lg font-bold text-foreground sm:text-xl">
                    {mobileTitle}
                </div>
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-0">
                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
                />

                {/* Main Content */}
                <main className={`relative flex min-h-0 min-w-0 flex-1 flex-col transition-[margin] duration-300 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-52"}`}>
                    {isPatientPortal && (
                        <img
                            src={clinicaParqueLogo}
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute right-4 top-3 z-20 h-20 w-28 object-contain opacity-15 mix-blend-multiply sm:right-6 sm:top-4 sm:h-24 sm:w-32"
                        />
                    )}
                    {/* Content Area */}
<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
                        <div className="flex-1 flex flex-col min-h-0">
                            {children}
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};
