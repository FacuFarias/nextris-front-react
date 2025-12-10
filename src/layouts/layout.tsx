import { useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import fondoImage from "@/assets/fondo1.png";

interface MainLayoutProps {
    children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center px-4">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                    {sidebarOpen ? (
                        <X className="w-6 h-6 text-foreground" />
                    ) : (
                        <Menu className="w-6 h-6 text-foreground" />
                    )}
                </button>
                <div className="ml-4 font-display text-xl font-bold text-foreground">
                    Next<span className="text-primary">RIS</span>
                </div>
            </div>

            <div className="flex flex-1 pt-16 lg:pt-0 min-h-screen">
                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content */}
                <main className="flex-1 flex flex-col lg:ml-64 relative">
                    {/* Background con overlay morado */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: ` url(${fondoImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                        }}
                    />

                    {/* Content Area */}
                    <div className="flex-1 p-4 md:p-6 lg:p-8 relative z-10">

                        {children}
                    </div>

                    {/* Footer */}
                    <Footer />
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
