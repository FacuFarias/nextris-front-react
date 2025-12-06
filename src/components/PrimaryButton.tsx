import React from 'react'
import { Button } from './ui/button'

export const PrimaryButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
    return (
        <Button
            className="bg-brand-purple hover:bg-purple-800 text-white w-full sm:w-auto cursor-pointer"
            onClick={onClick}
        >
            {children}
        </Button>
    )
}
