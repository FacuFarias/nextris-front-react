/** Staff roles are templates. Saved permissions determine access. */
export const hasAnyPermission = (codes: readonly string[] | undefined, required: readonly string[]) =>
    Boolean(codes?.includes('*') || required.some((code) => codes?.includes(code)));

export const hasRoleAccess = (role: string | undefined, allowed?: readonly string[]) => {
    if (!allowed?.length) return true;
    return role?.toLowerCase() === 'patient'
        ? allowed.includes('patient')
        : allowed.some((item) => item !== 'patient');
};

export const DEFAULT_DISABLED_MODULES = [] as string[];

export const moduleForPath = (path: string) => {
    if (path.startsWith('/cita/')) return 'appointments';
    if (['/nueva-admision', '/admision-espontanea'].includes(path)) return 'admissions';
    if (path.startsWith('/nexi')) return 'nexi';
    if (path.startsWith('/reportes-estructurados')) return 'structured_reports';
    return undefined;
};

export const permissionModuleLabels: Record<string, string> = {
    veterinary: 'Veterinaria', patients: 'Pacientes', worklist: 'Lista de trabajo', images: 'Imágenes',
    reports: 'Informes', templates: 'Informes predefinidos', dicom: 'Estudios DICOM',
    distribution: 'Distribución', gestion: 'Gestión administrativa',
    config: 'Configuración', users: 'Usuarios y permisos',
    admissions: 'Admisión', appointments: 'Citas', nexi: 'Nexi', structured_reports: 'Reportes estructurados',
};
