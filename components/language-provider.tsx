"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "pt" | "en" | "es"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const translations = {
    pt: {
        "nav.login": "Entrar",
        "nav.dashboard": "Acessar Dashboard",
        "hero.badge": "Analytics em Tempo Real",
        "hero.title.prefix": "Analise Seus Quizzes em",
        "hero.title.suffix": "Tempo Real",
        "hero.description": "Acompanhe desempenho, leads e conversões dos seus quizzes em um único painel simples e inteligente. Tome decisões baseadas em dados.",
        "hero.cta.primary": "Começar Agora",
        "hero.cta.secondary": "Saiba Mais",
        "features.title": "Funcionalidades",
        "features.subtitle": "Tudo que você precisa",
        "footer.terms": "Termos",
        "footer.privacy": "Privacidade",
        "footer.contact": "Contato",
        "footer.rights": "Todos os direitos reservados.",
    },
    en: {
        "nav.login": "Login",
        "nav.dashboard": "Access Dashboard",
        "hero.badge": "Real-Time Analytics",
        "hero.title.prefix": "Analyze Your Quizzes in",
        "hero.title.suffix": "Real Time",
        "hero.description": "Track performance, leads, and conversions of your quizzes in a single simple and intelligent dashboard. Make data-driven decisions.",
        "hero.cta.primary": "Start Now",
        "hero.cta.secondary": "Learn More",
        "features.title": "Features",
        "features.subtitle": "Everything you need",
        "footer.terms": "Terms",
        "footer.privacy": "Privacy",
        "footer.contact": "Contact",
        "footer.rights": "All rights reserved.",
    },
    es: {
        "nav.login": "Entrar",
        "nav.dashboard": "Acceder al Panel",
        "hero.badge": "Analítica en Tiempo Real",
        "hero.title.prefix": "Analiza tus Quizzes en",
        "hero.title.suffix": "Tiempo Real",
        "hero.description": "Sigue el rendimiento, leads y conversiones de tus quizzes en un único panel simple e inteligente. Toma decisiones basadas en datos.",
        "hero.cta.primary": "Empezar Ahora",
        "hero.cta.secondary": "Saber Más",
        "features.title": "Funcionalidades",
        "features.subtitle": "Todo lo que necesitas",
        "footer.terms": "Términos",
        "footer.privacy": "Privacidad",
        "footer.contact": "Contacto",
        "footer.rights": "Todos los derechos reservados.",
    }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("pt")

    const t = (key: string) => {
        return (translations[language] as any)[key] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
