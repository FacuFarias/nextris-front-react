import { Headset, Code } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="py-4 px-4 md:px-6 lg:px-8 z-10" style={{ background: 'linear-gradient(to bottom, #2D1B4E 0%, #2D1B4E 40%, #1a0f2e 100%)' }}>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-white/80">
                    Producto de <span className="font-semibold text-white">Soft[in]Health</span>
                </div>

                <div className="flex items-center gap-6">
                    <a
                        href="#"
                        className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                        <Headset className="w-4 h-4" />
                        <span>Soporte</span>
                    </a>

                    <a
                        href="#"
                        className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                        <span className="font-semibold">Soft[in]Health</span>
                    </a>

                    <a
                        href="#"
                        className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                        <Code className="w-4 h-4" />
                        <span>Facundo Farias</span>
                    </a>
                </div>
            </div>
        </footer>
    );
};
