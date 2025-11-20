"use client"

import { useEffect, useState, useRef } from "react"

interface TypewriterProps {
    text: string
    speed?: number
    className?: string
    cursor?: boolean
}

export function Typewriter({ text, speed = 100, className = "", cursor = false }: TypewriterProps) {
    const [displayedText, setDisplayedText] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const elementRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                } else {
                    setIsVisible(false)
                    setDisplayedText("") // Reset when out of view
                }
            },
            { threshold: 0.1 }
        )

        if (elementRef.current) {
            observer.observe(elementRef.current)
        }

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!isVisible) return

        let i = 0
        setDisplayedText("") // Ensure clean start

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.slice(0, i + 1)) // Deterministic slicing
                i++
            } else {
                clearInterval(timer)
            }
        }, speed)

        return () => clearInterval(timer)
    }, [isVisible, text, speed])

    return (
        <span ref={elementRef} className={className}>
            {displayedText}
            {cursor && (
                <span className="animate-pulse text-[#2D3748] ml-1">|</span>
            )}
        </span>
    )
}
