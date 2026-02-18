import { Edit, Trash2 } from 'lucide-react';
import type { TableAction, TableColumn } from '@/types/table';
import type { Tag } from '../types/tags.types';

const tagColumns: TableColumn<Tag>[] = [
  {
    key: 'description',
    label: 'DESCRIPCIÓN',
    className: 'font-medium',
  },
  {
    key: 'is_active',
    label: 'ESTADO',
    render: (row: Tag) => (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          row.is_active
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {row.is_active ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

export const getTagActions = (
  onEdit: (tag: Tag) => void,
  onDelete: (tag: Tag) => void,
): TableAction<Tag>[] => [
  {
    label: 'editar',
    icon: <Edit className="h-4 w-4 text-blue-900" />,
    onClick: onEdit,
  },
  {
    label: 'eliminar',
    icon: <Trash2 className="h-4 w-4 text-red-600" />,
    onClick: onDelete,
  },
];

export { tagColumns };
