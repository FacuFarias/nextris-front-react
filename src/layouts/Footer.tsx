import { Headset, Code } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="z-10 hidden px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:block md:px-6 lg:px-8" style={{ background: 'linear-gradient(to bottom, #2D1B4E 0%, #2D1B4E 40%, #1a0f2e 100%)' }}>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-white/80">
                    Producto de <span className="font-semibold text-white">Soft[in]Health</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                    <a
                        href="#"
                        className="flex min-h-11 items-center gap-2 text-sm text-white/80 transition-colors hover:text-white md:min-h-0"
                    >
                        <Headset className="w-4 h-4" />
                        <span>Soporte</span>
                    </a>

                    <a
                        href="#"
                        className="flex min-h-11 items-center gap-2 text-sm text-white/80 transition-colors hover:text-white md:min-h-0"
                    >
                        <span className="font-semibold">Soft[in]Health</span>
                    </a>

                    <a
                        href="#"
                        className="flex min-h-11 items-center gap-2 text-sm text-white/80 transition-colors hover:text-white md:min-h-0"
                    >
                        <Code className="w-4 h-4" />
                        <span>Facundo Farias</span>
                    </a>
                </div>
            </div>
        </footer>
    );
};
