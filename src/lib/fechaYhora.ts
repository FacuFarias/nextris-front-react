export const fechaYhora = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleString();
}