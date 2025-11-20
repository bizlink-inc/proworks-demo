import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-16 w-full rounded-[var(--pw-radius-sm)] border border-[var(--pw-border-gray)] bg-white px-3 py-2 text-base',
          'placeholder:text-[var(--pw-text-light-gray)]',
          'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[var(--pw-input-focus)] focus:bg-[var(--pw-bg-light-blue)]',
          'disabled:cursor-not-allowed disabled:bg-[var(--pw-text-lightest)] disabled:text-[var(--pw-text-light-gray)]',
          'transition-colors',
          className,
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
