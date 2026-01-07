import type { ReactNode } from "react";
import fondoImage from "@/assets/fondo1.png";

interface LayoutSinSidebarProps {
    children: ReactNode;
}

export const LayoutSinSidebar = ({ children }: LayoutSinSidebarProps) => {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center px-4">
                <div className="font-display text-xl font-bold text-foreground">
                    Next<span className="text-primary">RIS</span>
                </div>
            </div>

            <div className="flex flex-1 pt-16 lg:pt-0 min-h-screen">
                {/* Main Content - Sin sidebar */}
                <main className="flex-1 flex flex-col relative w-full">
                    {/* Background con overlay morado */}
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

                    {/* Content Area */}
                    <div className="flex-1 p-4 md:p-6 lg:p-8 relative z-10">
                        {children}
                    </div>


                </main>
            </div>
        </div>
    );
};
