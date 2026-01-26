import { z } from 'zod';

export const bodyPartFormSchema = z.object({
    description: z.string().min(1, 'La descripción es requerida'),
});

export type GrruposEstudioFormValues = z.infer<typeof bodyPartFormSchema>;
