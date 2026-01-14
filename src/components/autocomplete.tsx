import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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

export interface AutocompleteOption {
    value: string;
    label: string;
}

interface AutocompleteProps {
    options: AutocompleteOption[];
    value?: string;
    onValueChange?: (value: string) => void;
    onSearchChange?: (search: string) => void;
    placeholder?: string;
    emptyMessage?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    isLoading?: boolean;
    error?: string;
    className?: string;
    initialOption?: AutocompleteOption;
}

export function Autocomplete({
    options,
    value,
    onValueChange,
    onSearchChange,
    placeholder = "Seleccionar...",
    emptyMessage = "No se encontraron resultados",
    searchPlaceholder = "Buscar...",
    disabled = false,
    isLoading = false,
    initialOption,
    error,
    className,
}: AutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const handleSearchChange = (value: string) => {
        setSearch(value);
        onSearchChange?.(value);
    };

    let selectedOption = options.find((option) => option.value === value);

    if (
        !selectedOption &&
        initialOption !== undefined &&
        initialOption.value === value
    ) {
        selectedOption = initialOption;
    }

    const handleSelect = (selectedValue: string) => {
        onValueChange?.(selectedValue === value ? "" : selectedValue);
        setOpen(false);
    };

    return (
        <div className={cn("w-full", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled || isLoading}
                        className={cn(
                            "w-full justify-between font-normal transition-all cursor-pointer",
                            !selectedOption && "text-muted-foreground",
                            error && "border-destructive focus-visible:ring-destructive",
                            "hover:bg-accent hover:border-primary/50"
                        )}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando...
                            </span>
                        ) : selectedOption ? (
                            <span
                                className="block max-w-full truncate"
                                title={selectedOption.label}
                            >
                                {selectedOption.label}
                            </span>
                        ) : (
                            placeholder
                        )}

                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="p-0 shadow-medium z-100"
                    align="start"
                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                >
                    <Command shouldFilter={false} className="min-h-[200px]">
                        <CommandInput
                            placeholder={searchPlaceholder}
                            value={search}
                            onValueChange={handleSearchChange}
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>
                                {isLoading ? (
                                    <div className="flex justify-center items-center p-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-sm">{emptyMessage}</div>
                                )}
                            </CommandEmpty>

                            <CommandGroup>
                                {options
                                    .filter((option) => {
                                        if (!option || !option.label) return false;
                                        return option.label
                                            .toLowerCase()
                                            .includes(search.toLowerCase());
                                    })
                                    .map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label}
                                            onSelect={() => handleSelect(option.value)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4 text-primary",
                                                    value === option.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && (
                <p className="mt-1.5 text-sm text-destructive animate-in fade-in-50 slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
}
