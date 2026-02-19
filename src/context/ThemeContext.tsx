import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'nextris-theme',
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const root = window.document.documentElement;

        // Agregar clase para deshabilitar transiciones
        root.classList.add('changing-theme');

        root.classList.remove('light', 'dark');

        let resolvedTheme: 'light' | 'dark' = 'light';

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            resolvedTheme = systemTheme;
        } else {
            resolvedTheme = theme;
        }

        root.classList.add(resolvedTheme);
        setActualTheme(resolvedTheme);

        // Remover clase después de que el DOM se actualice
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                root.classList.remove('changing-theme');
            });
        });
    }, [theme]);

    // Escuchar cambios en el tema del sistema
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            const systemTheme = mediaQuery.matches ? 'dark' : 'light';
            const root = window.document.documentElement;

            // Agregar clase para deshabilitar transiciones
            root.classList.add('changing-theme');

            root.classList.remove('light', 'dark');
            root.classList.add(systemTheme);
            setActualTheme(systemTheme);

            // Remover clase después de que el DOM se actualice
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    root.classList.remove('changing-theme');
                });
            });
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const value = {
        theme,
        setTheme: (newTheme: Theme) => {
            localStorage.setItem(storageKey, newTheme);
            setTheme(newTheme);
        },
        actualTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
