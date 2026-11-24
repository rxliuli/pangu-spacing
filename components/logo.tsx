import { cn } from '@/lib/utils'

/** Original Pangu Spacing mark (CJK 文 + space bracket ␣ + Latin A), drawn in currentColor so it follows the theme. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      aria-hidden="true"
    >
      <g strokeWidth="8">
        <path d="M 26 14 L 26 21" />
        <path d="M 10 27 L 42 27" />
        <path d="M 35.5 27.5 C 33 42.5 24 54 11 61.5" />
        <path d="M 16.5 27.5 C 19 41.5 27.5 52.5 40.5 61.5" />
        <path d="M 59 61.5 L 74.5 16 L 90 61.5" />
        <path d="M 64.5 47.5 L 84.5 47.5" />
      </g>
      <path d="M 34 73 L 34 83 L 66 83 L 66 73" strokeWidth="7.5" />
    </svg>
  )
}
