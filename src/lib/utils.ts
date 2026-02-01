import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert simple markdown (headings, bold, lists, paragraphs) to HTML.
 * Used for rendering AI-generated recap articles.
 */
export function markdownToHtml(markdown: string): string {
  return markdown
    .split('\n\n')
    .map(block => {
      block = block.trim()
      if (!block) return ''

      // Headings
      if (block.startsWith('### ')) {
        return `<h3>${applyInline(block.slice(4))}</h3>`
      }
      if (block.startsWith('## ')) {
        return `<h2>${applyInline(block.slice(3))}</h2>`
      }

      // Bullet list (block where every line starts with - )
      const lines = block.split('\n')
      if (lines.every(l => l.trimStart().startsWith('- '))) {
        const items = lines
          .map(l => `<li>${applyInline(l.trimStart().slice(2))}</li>`)
          .join('')
        return `<ul>${items}</ul>`
      }

      // Paragraph with inline formatting and line breaks
      return `<p>${applyInline(block.replace(/\n/g, '<br />'))}</p>`
    })
    .join('')
}

function applyInline(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}
