import React from 'react'
import { Button } from './ui/button'

export const SecondaryButton = ({ children, onClick, type = 'button', disabled = false }: { children: React.ReactNode, onClick?: () => void, type?: "button" | "submit" | "reset", disabled?: boolean }) => {
    return (
        <Button
            className="bg-white border border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white"
            onClick={onClick}
            type={type}
            disabled={disabled}
        >
            {children}
        </Button>
    )
}
