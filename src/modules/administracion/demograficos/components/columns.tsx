import type { TableColumn } from "@/types/table";
import type { Examinacion } from "../types/demograficos.type";

export const demograficosColumns: TableColumn<Examinacion>[] = [
    {
        key: "createdon",
        label: "Fecha",
        className: "font-medium whitespace-nowrap",
    },
    {
        key: "localacc",
        label: "Accession",
        className: "font-medium",
    },
    {
        key: "name",
        label: "Nombre",
        className: "font-medium",
        render: (_, row) => `${row.name} ${row.surname}`,
    },
    {
        key: "nationalcode",
        label: "DNI",
        className: "font-medium",
    },
    {
        key: "sexcode",
        label: "Sexo",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "birthdate",
        label: "Nacimiento",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "study_type",
        label: "Estudio",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "status",
        label: "Estado",
        className: "font-medium",
        hideOnMobile: true,
    },
];
