'use client'

interface SelectionCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function SelectionCheckbox({ checked, onChange, label }: SelectionCheckboxProps) {
  return (
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      {label && <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">{label}</span>}
    </label>
  )
}

