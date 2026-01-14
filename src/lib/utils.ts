import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim();
};
