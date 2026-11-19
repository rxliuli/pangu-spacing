import { useId, type ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

/** A labelled switch row. The label sits on the left and toggles the switch too. */
export function SettingSwitch({
  label,
  description,
  title,
  checked,
  disabled,
  onCheckedChange,
  className,
}: {
  label: string
  description?: ReactNode
  title?: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) {
  const id = useId()
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        disabled && 'opacity-60',
        className,
      )}
      title={title}
    >
      <div className="grid gap-1">
        <label
          htmlFor={id}
          className={cn(
            'text-sm leading-5 font-medium pointer-coarse:text-base',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {label}
        </label>
        {description && (
          <div className="grid gap-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      <Switch
        id={id}
        className="mt-0.5"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
