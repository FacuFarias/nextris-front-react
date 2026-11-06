import type { ReactNode } from "react";
import fondoImage from "@/assets/fondo1.png";

interface LayoutSinSidebarProps {
    children: ReactNode;
    disableDefaultBackground?: boolean;
}

export const LayoutSinSidebar = ({ children, disableDefaultBackground = false }: LayoutSinSidebarProps) => {
    return (
        <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-background">
            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] items-center border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)] lg:hidden">
                <div className="font-display text-xl font-bold text-foreground">
                    Next<span className="text-primary">RIS</span>
                </div>
            </div>

            <div className="flex min-h-dvh min-w-0 flex-1 pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-0">
                {/* Main Content - Sin sidebar */}
                <main className="relative flex w-full min-w-0 flex-1 flex-col">
                    {/* Background con overlay morado */}
                    {!disableDefaultBackground && (
                        <div
                            className="absolute inset-0 z-0"
                            style={{
                                backgroundImage: `url(${fondoImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                backgroundAttachment: 'fixed',
                            }}
                        />
                    )}

                    {/* Content Area */}
                    <div className="relative z-10 min-w-0 flex-1 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:p-4 md:p-6 lg:p-3">
                        {children}
                    </div>


                </main>
            </div>
        </div>
    );
};
