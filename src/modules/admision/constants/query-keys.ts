export const admisionKeys = {
    all: ["admision"] as const,
    pacientesDireccion: () => [...admisionKeys.all, "pacientesDireccion"] as const,
};
