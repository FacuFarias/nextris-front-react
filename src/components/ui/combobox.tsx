"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
    label: string;
    value: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    emptyMessage?: string;
    searchPlaceholder?: string;
    loading?: boolean;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Seleccione...",
    emptyMessage = "No se encontraron resultados",
    searchPlaceholder = "Buscar...",
    loading = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);

    const selectedLabel = options.find((o) => o.value === value)?.label;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedLabel || placeholder}
                    <ChevronsUpDown className="opacity-50 w-4 h-4" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} className="h-9" />
                    <CommandList>
                        {loading && <CommandEmpty>Cargando...</CommandEmpty>}
                        {!loading && <CommandEmpty>{emptyMessage}</CommandEmpty>}
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    {option.label}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
