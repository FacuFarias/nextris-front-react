import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PrimaryButton, SecondaryButton } from '@/components';
import { tagSchema, type TagFormValues } from '../schemas/tag.schema';
import type { TagFormData } from '../types/tags.types';

interface TagFormProps {
  facilityId: string;
  onSubmit: (data: TagFormData) => void;
  onCancel: () => void;
  initialData?: Partial<TagFormValues>;
  isLoading?: boolean;
}

export const TagForm = ({
  facilityId,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: TagFormProps) => {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      description: initialData?.description ?? '',
      is_active: initialData?.is_active ?? true,
    },
  });

  const handleSubmit = (values: TagFormValues) => {
    onSubmit({ ...values, facility_id: facilityId });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4">
        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción * <span className="text-xs text-gray-400">(máx. 20 caracteres)</span></FormLabel>
              <FormControl>
                <Input placeholder="Ej: URGENTE" maxLength={20} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estado */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </FormControl>
              <FormLabel className="!mt-0 cursor-pointer">Tag activo</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2 border-t">
          <SecondaryButton type="button" onClick={onCancel}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </PrimaryButton>
        </div>
      </form>
    </Form>
  );
};
