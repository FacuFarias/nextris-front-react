import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
    const { actualTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(actualTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <Button variant="outline" className="w-full justify-start gap-2" onClick={toggleTheme}>
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="dark:hidden">Modo Claro</span>
            <span className="hidden dark:inline">Modo Oscuro</span>
        </Button>
    );
}
