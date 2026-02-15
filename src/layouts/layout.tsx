import { useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

interface MainLayoutProps {
    children: ReactNode;
    isOverflow?: boolean;
}

export const MainLayout = ({ children, isOverflow = true }: MainLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={`flex flex-col bg-background ${isOverflow ? "overflow-hidden h-screen" : ""}`}>
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

            <div className="flex flex-1 pt-16 lg:pt-0 min-h-0">
                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content */}
                <main className="flex-1 flex flex-col lg:ml-52 relative min-h-0">
                    {/* Content Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 flex flex-col min-h-0">
                            {children}
                        </div>
                        <Footer />
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
