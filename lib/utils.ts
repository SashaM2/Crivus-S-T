import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const day = d.getDate().toString().padStart(2, "0")
  const month = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, "0")
  const minutes = d.getMinutes().toString().padStart(2, "0")

  return `${day} ${month} ${year} • ${hours}:${minutes}`
}

export function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const day = d.getDate().toString().padStart(2, "0")
  const month = MONTHS[d.getMonth()]
  const year = d.getFullYear()

  return `${day} ${month} ${year}`
}

