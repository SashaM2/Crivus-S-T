"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { Globe } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#2D3748] hover:bg-gray-50 rounded-md h-9 w-9">
                    <Globe className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-md">
                <DropdownMenuItem onClick={() => setLanguage("pt")} className="cursor-pointer hover:bg-gray-50">
                    🇧🇷 Português
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} className="cursor-pointer hover:bg-gray-50">
                    🇺🇸 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("es")} className="cursor-pointer hover:bg-gray-50">
                    🇪🇸 Español
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
