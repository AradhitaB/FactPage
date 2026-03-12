import type { Variant } from '@/types'

interface CTAButtonProps {
  variant: Variant
  onClick: () => void
}

// Single variable between A and B: filled vs outlined.
// Copy, size, and position are identical — isolates the visual treatment.
const STYLES: Record<Variant, string> = {
  A: 'bg-accent text-zinc-950 hover:brightness-110',
  B: 'border border-accent text-accent hover:bg-accent-dim',
}

export default function CTAButton({ variant, onClick }: CTAButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full rounded-xl px-6 py-4 text-sm font-semibold
        transition-all duration-150 active:scale-[0.98]
        ${STYLES[variant]}
      `}
    >
      See the Results
    </button>
  )
}
