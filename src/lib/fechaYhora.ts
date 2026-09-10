type DateValue = string | Date | null | undefined;

const pad = (value: number) => String(value).padStart(2, "0");

const dateParts = (value: DateValue): [string, string, string] | null => {
    if (!value) return null;

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return [pad(value.getDate()), pad(value.getMonth() + 1), String(value.getFullYear()).slice(-2)];
    }

    const dateString = String(value).trim();
    if (!dateString) return null;

    // Fechas DICOM: YYYYMMDD, incluso cuando vienen seguidas de una hora.
    const dicomMatch = dateString.match(/^(\d{4})(\d{2})(\d{2})/);
    if (dicomMatch) {
        return [dicomMatch[3], dicomMatch[2], dicomMatch[1].slice(-2)];
    }

    // Fechas ISO o SQL: YYYY-MM-DD (se evita parsearlas como UTC).
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        return [isoMatch[3], isoMatch[2], isoMatch[1].slice(-2)];
    }

    // También normaliza valores ya presentados como DD/MM/YYYY o DD/MM/YY.
    const slashMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})/);
    if (slashMatch) {
        return [slashMatch[1].padStart(2, "0"), slashMatch[2].padStart(2, "0"), slashMatch[3].slice(-2)];
    }

    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return null;
    return [pad(parsed.getDate()), pad(parsed.getMonth() + 1), String(parsed.getFullYear()).slice(-2)];
};

/** Formato visible único de fecha: DD/MM/AA. */
export const formatDate = (value: DateValue): string => {
    const parts = dateParts(value);
    return parts ? parts.join("/") : value ? String(value) : "";
};

/** Formato visible para fecha y hora, manteniendo la fecha como DD/MM/AA. */
export const formatDateTime = (value: DateValue): string => {
    if (!value) return "";

    const parts = dateParts(value);
    if (!parts) return String(value);

    const parsed = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(parsed.getTime())) return String(value);

    const time = parsed.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    return `${parts.join("/")} ${time}`;
};

export const fechaYhora = (fecha: string) => formatDateTime(fecha);
