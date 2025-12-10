import React from 'react'
import { Button } from './ui/button'

export const SecondaryButton = ({ children, onClick, type = 'button', disabled = false }: { children: React.ReactNode, onClick?: () => void, type?: "button" | "submit" | "reset", disabled?: boolean }) => {
    return (
        <Button
            className="bg-brand-purple hover:bg-purple-800 text-white w-full sm:w-auto cursor-pointer"
            onClick={onClick}
            type={type}
            disabled={disabled}
        >
            {children}
        </Button>
    )
}
