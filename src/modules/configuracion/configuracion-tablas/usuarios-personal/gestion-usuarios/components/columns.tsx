import type { TableColumn, TableAction } from "@/types/table";
import type { User } from "../types/users.types";
import { Edit, Lock, LogIn, Trash2 } from "lucide-react";

export const getUserColumns = (): TableColumn<User>[] => [
    {
        key: "username",
        label: "USUARIO",
        className: "font-medium",
    },
    {
        key: "name",
        label: "NOMBRE",
        className: "font-medium",
        render: (_value, row) => `${row.name} ${row.surname}`,
    },
    {
        key: "role",
        label: "ROL",
        className: "font-medium",
    },
    {
        key: "national_number",
        label: "DNI/CI",
        className: "font-medium",
        render: (value) => value || "-",
    },
    {
        key: "email",
        label: "EMAIL",
        className: "font-medium",
        render: (value) => value || "-",
    },
    {
        key: "phone",
        label: "TELÉFONO",
        className: "font-medium",
        render: (value) => value || "-",
    },
    {
        key: "is_active",
        label: "ESTADO",
        className: "font-medium",
        render: (_value, row) => (
            <span className={`px-2 py-1 rounded-full text-xs ${row.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {row.is_active ? 'Activo' : 'Inactivo'}
            </span>
        ),
    },
];

export const getUserActions = (
    onEditar: (user: User) => void,
    onResetPassword: (user: User) => void,
    onEliminar: (user: User) => void,
    onImpersonate?: (user: User) => void,
    currentUserId?: string,
    canManageUsers = true,
): TableAction<User>[] => [
        ...(onImpersonate ? [{
            label: "Conectarme como este usuario",
            icon: <LogIn className="h-4 w-4 text-emerald-700" />,
            onClick: onImpersonate,
            hidden: (user: User) => !user.is_active || user.guid === currentUserId,
        }] : []),
        ...(canManageUsers ? [{
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEditar,
        }, {
            label: "Resetear Contraseña",
            icon: <Lock className="h-4 w-4 text-purple-600" />,
            onClick: onResetPassword,
        }, {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4 text-red-600" />,
            onClick: onEliminar,
        }] : []),
    ];
