import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { PrimaryButton, SecondaryButton } from "@/components";
import { bodyPartFormSchema, type BodyPartFormValues } from "../schemas/body-part.schema";
import type { BodyPartFormData } from "../types/body-parts.types";

interface BodyPartFormProps {
    onSubmit: (data: BodyPartFormData) => void;
    onCancel: () => void;
    initialData?: Partial<BodyPartFormData>;
    isLoading?: boolean;
}

export const BodyPartForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: BodyPartFormProps) => {
    const form = useForm<BodyPartFormValues>({
        resolver: zodResolver(bodyPartFormSchema),
        defaultValues: {
            description: initialData?.description || "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => onSubmit(data as BodyPartFormData))} className="space-y-4">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Descripción <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ej: Cráneo, Tórax, Abdomen..."
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <SecondaryButton
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                                Guardando...
                            </>
                        ) : (
                            "Guardar"
                        )}
                    </PrimaryButton>
                </div>
            </form>
        </Form>
    );
};
