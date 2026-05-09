import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

export type DropdownOption<TValue extends string | number> = {
  value: TValue
  label: string
  disabled?: boolean
}

type Size = 'sm' | 'md'

function cx(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(' ')
}

function normalize(v: unknown) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
}

export function DropdownSelect<TValue extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  size = 'md',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search…',
  menuMaxHeight = 320,
  className,
  buttonClassName,
  menuClassName,
}: {
  value: TValue | '' | null | undefined
  onChange: (value: TValue | '') => void
  options: DropdownOption<TValue>[]
  placeholder?: string
  size?: Size
  disabled?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  menuMaxHeight?: number
  className?: string
  buttonClassName?: string
  menuClassName?: string
}) {
  const reactId = useId()
  const buttonId = `ddselect-btn-${reactId}`
  const listboxId = `ddselect-list-${reactId}`
  const labelId = `ddselect-label-${reactId}`

  const rootRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selected = useMemo(() => {
    const v = value === null || value === undefined ? '' : value
    return options.find((o) => String(o.value) === String(v)) ?? null
  }, [options, value])

  const filtered = useMemo(() => {
    if (!searchable) return options
    const q = normalize(query)
    if (!q) return options
    return options.filter((o) => normalize(o.label).includes(q))
  }, [options, query, searchable])

  const firstEnabledIndex = useMemo(() => {
    const idx = filtered.findIndex((o) => !o.disabled)
    return idx >= 0 ? idx : 0
  }, [filtered])

  const setOpenState = useCallback((next: boolean, opts?: { focusButton?: boolean }) => {
    const focusButton = opts?.focusButton ?? true
    if (next) {
      setOpen(true)
      setActiveIndex(firstEnabledIndex)
      if (searchable) queueMicrotask(() => searchRef.current?.focus())
    } else {
      setOpen(false)
      setQuery('')
      if (focusButton) queueMicrotask(() => buttonRef.current?.focus())
    }
  }, [firstEnabledIndex, searchable])

  useEffect(() => {
    if (!open) return
    function onDocPointerDown(e: PointerEvent) {
      const el = e.target as Node | null
      if (!el) return
      if (!rootRef.current?.contains(el)) setOpenState(false, { focusButton: false })
    }
    function onDocKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpenState(false, { focusButton: true })
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onDocKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown)
      document.removeEventListener('keydown', onDocKeyDown)
    }
  }, [open])

  function openMenu() {
    if (disabled) return
    setOpenState(true)
  }

  function closeMenu(focusButton = true) {
    setOpenState(false, { focusButton })
  }

  function moveActive(delta: number) {
    if (!filtered.length) return
    let idx = activeIndex
    for (let i = 0; i < filtered.length; i++) {
      idx = (idx + delta + filtered.length) % filtered.length
      if (!filtered[idx]?.disabled) {
        setActiveIndex(idx)
        return
      }
    }
  }

  function selectOption(opt: DropdownOption<TValue>) {
    if (opt.disabled) return
    onChange(opt.value)
    closeMenu(true)
  }

  function onButtonKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpenState(!open)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) openMenu()
      else moveActive(1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) openMenu()
      else moveActive(-1)
    }
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveActive(1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveActive(-1)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[activeIndex]
      if (opt) selectOption(opt)
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu(true)
    }
  }

  const btnSizeClass = size === 'sm' ? 'btn-sm' : ''
  const menu = open ? (
    <div
      className={cx('dropdown-menu p-2 w-100', menuClassName)}
      style={{
        display: 'block',
        width: '100%',
        minWidth: '100%',
        maxHeight: menuMaxHeight,
        overflow: 'auto',
      }}
      role="listbox"
      id={listboxId}
      aria-labelledby={buttonId}
      aria-activedescendant={filtered[activeIndex] ? `${listboxId}-opt-${activeIndex}` : undefined}
      onKeyDown={onMenuKeyDown}
    >
      <div className="visually-hidden" id={labelId}>
        {placeholder}
      </div>
      {searchable ? (
        <div className="mb-2">
          <input
            ref={searchRef}
            className="form-control form-control-sm"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onMenuKeyDown}
          />
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <div className="text-muted small px-2 py-1">No results</div>
      ) : (
        <ul className="list-unstyled mb-0" role="presentation">
          {filtered.map((opt, idx) => {
            const isActive = idx === activeIndex
            const isSelected = selected ? String(selected.value) === String(opt.value) : false
            return (
              <li key={String(opt.value)} role="presentation">
                <button
                  type="button"
                  id={`${listboxId}-opt-${idx}`}
                  className={cx(
                    'dropdown-item d-flex align-items-center justify-content-between',
                    isActive && 'active',
                    opt.disabled && 'disabled'
                  )}
                  role="option"
                  aria-selected={isSelected}
                  disabled={Boolean(opt.disabled)}
                  onMouseEnter={() => {
                    if (!opt.disabled) setActiveIndex(idx)
                  }}
                  onClick={() => selectOption(opt)}
                >
                  <span className="text-truncate">{opt.label}</span>
                  {isSelected ? <span className="ms-3 small">✓</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  ) : null

  return (
    <div ref={rootRef} className={cx('dropdown', className)}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        className={cx(
          'btn btn-light border dropdown-toggle w-100 d-flex align-items-center justify-content-between gap-2',
          btnSizeClass,
          buttonClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpenState(!open)}
        onKeyDown={onButtonKeyDown}
      >
        <span
          className={cx('flex-grow-1 text-truncate', !selected && 'opacity-75')}
          style={{ maxWidth: '100%' }}
        >
          {selected ? selected.label : placeholder}
        </span>
      </button>
      {menu}
    </div>
  )
}

