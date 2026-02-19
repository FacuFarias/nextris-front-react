import { Search } from 'lucide-react'
import { Input } from './ui/input'

interface InputSearchProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    placeholder?: string;
}

export const InputSearch = ({ searchTerm, setSearchTerm, placeholder }: InputSearchProps) => {
    return (
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder || "Buscar...."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 border-purple-300 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm sm:text-base"
            />
        </div>

    )
}
