import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

/** A single-choice segmented control. Clicking the selected option keeps it selected. */
export function Segmented<T extends string>({
  value,
  options,
  onValueChange,
  className,
  'aria-label': ariaLabel,
}: {
  value: T | undefined
  options: SegmentedOption<T>[]
  onValueChange: (value: T) => void
  className?: string
  'aria-label'?: string
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value ?? ''}
      aria-label={ariaLabel}
      onValueChange={(next) => {
        if (next) onValueChange(next as T)
      }}
      className={cn(
        'grid w-full auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1',
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
