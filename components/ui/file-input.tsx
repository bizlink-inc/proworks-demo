import * as React from "react"
import { cn } from "@/lib/utils"

type FileInputProps = {
  id?: string
  accept?: string
  onChange?: (files: FileList | null) => void
  label?: string
  className?: string
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(({ id, accept, onChange, label = "ファイルを選択", className }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.files)
  }

  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <input
        id={id}
        ref={ref}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        className="inline-flex items-center px-3 py-2 border rounded-[var(--pw-radius-sm)] text-[var(--pw-text-sm)]"
        style={{ borderColor: "var(--pw-border-primary)", color: "var(--pw-button-primary)" }}
        onClick={(e) => {
          // forward click to hidden file input
          const input = (e.currentTarget.parentElement as HTMLElement)?.querySelector('input[type=\"file\"]') as HTMLInputElement | null
          input?.click()
        }}
      >
        {label}
      </button>
    </label>
  )
})

FileInput.displayName = "FileInput"

export { FileInput }


