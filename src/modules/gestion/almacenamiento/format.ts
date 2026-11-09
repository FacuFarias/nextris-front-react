const UNITS = ["B", "KiB", "MiB", "GiB", "TiB"];

export const formatBytes = (bytes: number, digits = 1) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
    const value = bytes / 1024 ** exponent;
    return `${value.toLocaleString("es-AR", { maximumFractionDigits: exponent === 0 ? 0 : digits })} ${UNITS[exponent]}`;
};

export const formatNumber = (value: number, digits = 0) =>
    value.toLocaleString("es-AR", { maximumFractionDigits: digits });

/** "2026-11-09" → "09/11" without shifting the day through the browser's time zone. */
export const formatDay = (isoDate: string) => {
    const [, month, day] = isoDate.slice(0, 10).split("-");
    return `${day}/${month}`;
};

export const formatDays = (days: number | null) => {
    if (days === null) return "sin ingresos en el período";
    if (days <= 0) return "ya alcanzado";
    if (days > 3650) return "más de 10 años";
    if (days > 365) return `≈ ${formatNumber(days / 365, 1)} años`;
    if (days > 60) return `≈ ${formatNumber(days / 30, 0)} meses`;
    return `≈ ${formatNumber(days, 0)} días`;
};

export const formatAge = (seconds: number | null) => {
    if (seconds === null) return "";
    if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min`;
    if (seconds < 172800) return `${formatNumber(seconds / 3600, 1)} h`;
    return `${formatNumber(seconds / 86400, 0)} días`;
};
