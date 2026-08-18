export const fechaYhora = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleString();
}


// Función helper para formatear fechas desde formato YYYYMMDD
export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    // Si la fecha viene en formato YYYYMMDD (ej: "20260209")
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        return `${day}/${month}/${year}`;
    }
    // Si viene en formato YYYY-MM-DD
    if (dateString.includes("-")) {
        return dateString.split("-").reverse().join("/");
    }
    return dateString;
};