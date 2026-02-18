import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type FlagColor = "red" | "green" | "blue" | "yellow";

const FLAG_CONFIG: { color: FlagColor; label: string; fill: string; stroke: string; ring: string }[] = [
    { color: "red",    label: "Roja",     fill: "#ef4444", stroke: "#b91c1c", ring: "ring-red-400" },
    { color: "green",  label: "Verde",    fill: "#22c55e", stroke: "#15803d", ring: "ring-green-400" },
    { color: "blue",   label: "Azul",     fill: "#3b82f6", stroke: "#1d4ed8", ring: "ring-blue-400" },
    { color: "yellow", label: "Amarilla", fill: "#facc15", stroke: "#a16207", ring: "ring-yellow-300" },
];

const FLAG_FILL: Record<FlagColor, { fill: string; stroke: string }> = {
    red:    { fill: "#ef4444", stroke: "#b91c1c" },
    green:  { fill: "#22c55e", stroke: "#15803d" },
    blue:   { fill: "#3b82f6", stroke: "#1d4ed8" },
    yellow: { fill: "#facc15", stroke: "#a16207" },
};

// Icono de bandera SVG inline (tipo "mast flag")
const FlagIcon = ({ fill, stroke, size = 14 }: { fill: string; stroke: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* Mástil */}
        <line x1="4" y1="2" x2="4" y2="22" />
        {/* Bandera triangular */}
        <polyline points="4,2 20,9 4,16" />
    </svg>
);

// Bandera gris vacía para cuando no hay ninguna
const EmptyFlagIcon = () => (
    <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="4" y1="2" x2="4" y2="22" />
        <polyline points="4,2 20,9 4,16" />
    </svg>
);

interface FlagsCellProps {
    examId: string;
    currentFlags: string[];
    onUpdate: (examId: string, flags: string[]) => void;
    isUpdating?: boolean;
}

export const FlagsCell = ({ examId, currentFlags, onUpdate, isUpdating }: FlagsCellProps) => {
    const [open, setOpen] = useState(false);

    const toggle = (color: FlagColor) => {
        const next = currentFlags.includes(color)
            ? currentFlags.filter(f => f !== color)
            : [...currentFlags, color];
        onUpdate(examId, next);
    };

    const activeFlags = currentFlags.filter((f): f is FlagColor => f in FLAG_FILL);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="flex items-center gap-0.5 cursor-pointer min-w-[20px] min-h-[20px] focus:outline-none hover:opacity-80 transition-opacity"
                    title="Gestionar banderas"
                    disabled={isUpdating}
                    onClick={(e) => e.stopPropagation()}
                >
                    {activeFlags.length === 0 ? (
                        <EmptyFlagIcon />
                    ) : (
                        activeFlags.map(color => (
                            <FlagIcon
                                key={color}
                                fill={FLAG_FILL[color].fill}
                                stroke={FLAG_FILL[color].stroke}
                                size={14}
                            />
                        ))
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-3"
                align="start"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Banderas</p>
                <div className="flex gap-3">
                    {FLAG_CONFIG.map(({ color, label, fill, stroke, ring }) => {
                        const active = currentFlags.includes(color);
                        return (
                            <button
                                key={color}
                                title={label}
                                disabled={isUpdating}
                                onClick={() => toggle(color)}
                                className={`flex flex-col items-center gap-1 p-1.5 rounded-md transition-all
                                    ${active ? `ring-2 ${ring} ring-offset-1 bg-gray-50 scale-110` : "opacity-40 hover:opacity-80"}
                                    disabled:cursor-not-allowed`}
                            >
                                <FlagIcon fill={fill} stroke={stroke} size={20} />
                                <span className="text-[10px] text-gray-600 leading-none">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
};
