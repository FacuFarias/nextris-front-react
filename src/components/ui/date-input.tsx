import { forwardRef, useEffect, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { formatDate, formatDateTime } from "@/lib/fechaYhora";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
    value?: string | null;
    onChange?: (value: string) => void;
};

const formatTypedDate = (value: string) => {
    const isoMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return formatDate(value);

    const fullSlashMatch = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (fullSlashMatch) {
        return `${fullSlashMatch[1].padStart(2, "0")}/${fullSlashMatch[2].padStart(2, "0")}/${fullSlashMatch[3].slice(-2)}`;
    }

    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const toIsoDate = (value: string): string => {
    const normalized = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;

    const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    if (!match) return "";

    const [, day, month, shortYear] = match;
    const yearNumber = Number(shortYear);
    const year = yearNumber <= 49 ? 2000 + yearNumber : 1900 + yearNumber;
    const candidate = `${year}-${month}-${day}`;
    const parsed = new Date(`${candidate}T00:00:00`);

    return parsed.getFullYear() === year &&
        parsed.getMonth() + 1 === Number(month) &&
        parsed.getDate() === Number(day)
        ? candidate
        : "";
};

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
    { value, onChange, onBlur, placeholder = "DD/MM/AA", ...props },
    ref,
) {
    const [displayValue, setDisplayValue] = useState(() => value ? formatDate(value) : "");

    useEffect(() => {
        setDisplayValue(value ? formatDate(value) : "");
    }, [value]);

    return (
        <input
            {...props}
            ref={ref}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            value={displayValue}
            onChange={(event) => {
                const nextDisplayValue = formatTypedDate(event.target.value);
                setDisplayValue(nextDisplayValue);
                onChange?.(toIsoDate(nextDisplayValue));
            }}
            onBlur={(event) => {
                onBlur?.(event);
                if (displayValue && !toIsoDate(displayValue)) {
                    setDisplayValue(value ? formatDate(value) : "");
                }
            }}
        />
    );
});

export const DateTimeInput = forwardRef<HTMLInputElement, DateInputProps>(function DateTimeInput(
    { value, onChange, placeholder = "DD/MM/AA HH:MM", ...props },
    ref,
) {
    const formatValue = (nextValue?: string | null) => {
        if (!nextValue) return "";
        const localMatch = nextValue.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
        if (localMatch) return `${formatDate(localMatch[1])} ${localMatch[2]}`;
        return formatDateTime(nextValue).slice(0, 16);
    };

    const [displayValue, setDisplayValue] = useState(() => formatValue(value));

    useEffect(() => {
        setDisplayValue(formatValue(value));
    }, [value]);

    return (
        <input
            {...props}
            ref={ref}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            value={displayValue}
            onChange={(event) => {
                const rawValue = event.target.value;
                const digits = rawValue.replace(/\D/g, "").slice(0, 10);
                let nextDisplayValue = digits;
                if (digits.length > 2) nextDisplayValue = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                if (digits.length > 4) nextDisplayValue = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                if (digits.length > 6) nextDisplayValue = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)} ${digits.slice(6, 8)}`;
                if (digits.length > 8) nextDisplayValue = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)} ${digits.slice(6, 8)}:${digits.slice(8, 10)}`;

                setDisplayValue(nextDisplayValue);
                const match = nextDisplayValue.match(/^(\d{2})\/(\d{2})\/(\d{2})\s(\d{2}):(\d{2})$/);
                if (!match) {
                    onChange?.("");
                    return;
                }

                const date = toIsoDate(`${match[1]}/${match[2]}/${match[3]}`);
                onChange?.(date ? `${date}T${match[4]}:${match[5]}` : "");
            }}
        />
    );
});
