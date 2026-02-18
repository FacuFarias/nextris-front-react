import { z } from 'zod';

export const tagSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida').max(20, 'Máximo 20 caracteres'),
  is_active: z.boolean(),
});

export type TagFormValues = z.infer<typeof tagSchema>;
