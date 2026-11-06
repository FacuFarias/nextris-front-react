import React from 'react'
import { Button } from './ui/button'

export const PrimaryButton = ({ children, onClick, type = 'button', disabled = false, title }: { children: React.ReactNode, onClick?: () => void, type?: "button" | "submit" | "reset", disabled?: boolean, title?: string }) => {
    return (
        <Button
            className="bg-brand-purple hover:bg-purple-800 text-white w-full sm:w-auto cursor-pointer"
            onClick={onClick}
            type={type}
            disabled={disabled}
            title={title}
        >
            {children}
        </Button>
    )
}
