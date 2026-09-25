type DateValue = string | Date | null | undefined;

const pad = (value: number) => String(value).padStart(2, "0");
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

const formatInstantParts = (value: Date): [string, string, string, string, string, string] | null => {
    if (Number.isNaN(value.getTime())) return null;

    const parts = new Intl.DateTimeFormat("es-AR", {
        timeZone: ARGENTINA_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(value);
    const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));

    return values.year && values.month && values.day && values.hour && values.minute && values.second
        ? [values.day, values.month, values.year.slice(-2), values.hour, values.minute, values.second]
        : null;
};

const hasExplicitTimeZone = (value: string) => /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);

const localDateTimeMatch = (value: string) => value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
);

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

    // También normaliza valores ya presentados como DD/MM/YYYY o DD/MM/YY.
    const slashMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})/);
    if (slashMatch) {
        return [slashMatch[1].padStart(2, "0"), slashMatch[2].padStart(2, "0"), slashMatch[3].slice(-2)];
    }

    if (hasExplicitTimeZone(dateString)) {
        const parsed = formatInstantParts(new Date(dateString));
        return parsed ? [parsed[0], parsed[1], parsed[2]] : null;
    }

    // Fechas ISO o SQL sin zona: representan hora local de la aplicacion.
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        return [isoMatch[3], isoMatch[2], isoMatch[1].slice(-2)];
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

    if (value instanceof Date) {
        return `${parts.join("/")} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
    }

    const dateString = String(value).trim();
    const localMatch = localDateTimeMatch(dateString);
    if (localMatch && !hasExplicitTimeZone(dateString)) {
        return `${parts.join("/")} ${localMatch[4]}:${localMatch[5]}:${localMatch[6] || "00"}`;
    }

    const formatted = formatInstantParts(new Date(dateString));
    if (!formatted) return String(value);
    return `${formatted.slice(0, 3).join("/")} ${formatted.slice(3).join(":")}`;
};

export const fechaYhora = (fecha: string) => formatDateTime(fecha);
