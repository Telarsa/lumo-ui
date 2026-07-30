import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'preact/hooks'

/**
 * Select — an accessible listbox, and a native `<select>` where native is better.
 *
 * ## The styling contract: data attributes, not class props
 *
 * This component applies **no classes and no styles**. It exposes state as
 * `data-*` attributes and you write CSS against them:
 *
 * ```css
 * [data-lumo-trigger][data-state='open'] { border-color: … }
 * [data-lumo-option][data-highlighted]   { background: … }
 * [data-lumo-option][data-selected]      { font-weight: 550 }
 * ```
 *
 * The alternative — a `classes` prop threaded through every part — is the
 * Radix-era pattern and it has aged badly. It couples the component to a class
 * *naming* strategy, it means every consumer writes the same plumbing, and it
 * pushes styling decisions into JavaScript where they cannot be affected by the
 * cascade. Attribute selectors are just CSS: they work with Tailwind, with
 * vanilla stylesheets, with cascade layers, and with a `<style>` block in a
 * page. Nothing has to be configured for them to work.
 *
 * It is also why libraries are moving off Tailwind for their own internals. A
 * library that emits utility classes forces every consumer onto the same
 * toolchain and the same major version of it. A library that emits
 * `data-state="open"` forces nothing.
 *
 * ## `pointer: coarse` gets a native control, deliberately
 *
 * The reason to replace a `<select>` is that the desktop OS popup looks foreign
 * in a designed interface. On a phone that reasoning inverts: iOS renders a
 * wheel picker and Android a full-screen list, both better than any custom
 * popup on a small screen, and neither reproducible. So the listbox is a
 * desktop affordance and touch keeps the platform control.
 *
 * That also means this is never the *worse* option: where a custom listbox is
 * weakest — touch, mobile screen readers — it does not run.
 *
 * ## Behaviour
 *
 * The full WAI-ARIA listbox pattern, because a partial one is worse than the
 * native control it replaces: `aria-activedescendant` rather than moving focus,
 * type-ahead, Home/End, Escape closing without committing, disabled options
 * skipped rather than landed on, and the trigger keeping focus throughout.
 */

export interface SelectOption {
  readonly value: string
  readonly label: string
  readonly disabled?: boolean
}

export interface SelectProps {
  readonly id: string
  readonly value: string
  readonly options: readonly SelectOption[]
  readonly onChange: (value: string) => void
  readonly onBlur?: () => void
  readonly describedBy?: string
  readonly invalid?: boolean
  readonly disabled?: boolean
  /**
   * Force one implementation. Omit for the default — native on a coarse
   * pointer, listbox on a fine one. Exists so tests can drive the listbox
   * without depending on what the runner reports about its pointer.
   */
  readonly render?: 'auto' | 'listbox' | 'native'
}

/** How long a run of keystrokes counts as one type-ahead search. */
const TYPEAHEAD_MS = 500

export function Select(props: SelectProps) {
  const { id, value, options, onChange, onBlur, describedBy, invalid, disabled } = props

  /*
   * Resolved on mount, never during render.
   *
   * `matchMedia` during render would differ between the server pass and the
   * first client pass, and the reconciler would throw away the server markup.
   * Starting as `null` — native until proven otherwise — makes the two agree,
   * so hydration is silent.
   */
  const [fine, setFine] = useState<boolean | null>(null)

  useEffect(() => {
    if (props.render && props.render !== 'auto') return
    const query = matchMedia('(pointer: fine)')
    setFine(query.matches)
    const listen = (event: MediaQueryListEvent) => setFine(event.matches)
    query.addEventListener('change', listen)
    return () => query.removeEventListener('change', listen)
  }, [props.render])

  const useListbox = props.render === 'listbox' || (props.render !== 'native' && fine === true)

  if (!useListbox) {
    return (
      <select
        id={id}
        data-lumo-select=""
        data-native=""
        data-invalid={invalid ? '' : undefined}
        value={value}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={invalid ? 'true' : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
        onBlur={onBlur}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  return <Listbox {...props} />
}

function Listbox({
  id,
  value,
  options,
  onChange,
  onBlur,
  describedBy,
  invalid,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const popupId = `${id}-listbox`
  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex((option) => option.value === value)),
    [options, value],
  )

  /** Where the keyboard is. Focus itself never leaves the trigger. */
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const optionId = useId()

  const selected = options[selectedIndex]

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) trigger.current?.focus()
  }, [])

  const commit = useCallback(
    (index: number) => {
      const option = options[index]
      if (!option || option.disabled) return
      onChange(option.value)
      close(true)
    },
    [options, onChange, close],
  )

  /** Skips disabled options; stops at the ends rather than wrapping. */
  const step = useCallback(
    (from: number, direction: 1 | -1) => {
      let next = from
      for (let i = 0; i < options.length; i += 1) {
        next += direction
        if (next < 0 || next >= options.length) return from
        if (!options[next]?.disabled) return next
      }
      return from
    },
    [options],
  )

  const edge = useCallback(
    (direction: 1 | -1) => step(direction === 1 ? -1 : options.length, direction),
    [options.length, step],
  )

  /* Type-ahead — the behaviour people miss most when a select is replaced. */
  const search = useCallback(
    (character: string) => {
      const now = Date.now()
      const text = now - typed.current.at < TYPEAHEAD_MS ? typed.current.text + character : character
      typed.current = { text, at: now }

      const lower = text.toLowerCase()
      const after = options.findIndex(
        (option, index) =>
          index > activeIndex && !option.disabled && option.label.toLowerCase().startsWith(lower),
      )
      const found =
        after === -1
          ? options.findIndex(
              (option) => !option.disabled && option.label.toLowerCase().startsWith(lower),
            )
          : after

      if (found !== -1) setActiveIndex(found)
    },
    [options, activeIndex],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault()
          if (!open) {
            setOpen(true)
            setActiveIndex(selectedIndex)
            return
          }
          setActiveIndex((current) => step(current, event.key === 'ArrowDown' ? 1 : -1))
          return
        }
        case 'Home':
        case 'End':
          if (!open) return
          event.preventDefault()
          setActiveIndex(edge(event.key === 'Home' ? 1 : -1))
          return
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (!open) {
            setOpen(true)
            setActiveIndex(selectedIndex)
            return
          }
          commit(activeIndex)
          return
        case 'Escape':
          if (!open) return
          /* One Escape dismisses one layer: a tool can sit inside a dialog. */
          event.preventDefault()
          event.stopPropagation()
          close(true)
          return
        case 'Tab':
          if (open) close(false)
          return
        default:
          if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
            if (!open) setOpen(true)
            search(event.key)
          }
      }
    },
    [open, selectedIndex, activeIndex, step, edge, commit, close, search],
  )

  /* Close on a click elsewhere. Pointerdown, so it beats the next mousedown. */
  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      const target = event.target as Node
      if (!trigger.current?.contains(target) && !popup.current?.contains(target)) close(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open, close])

  /* Keep the active option in view when the keyboard runs past the edge. */
  useEffect(() => {
    if (!open) return
    popup.current
      ?.querySelector(`#${CSS.escape(`${optionId}-${activeIndex}`)}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, optionId])

  return (
    <div data-lumo-select="" data-state={open ? 'open' : 'closed'}>
      <button
        ref={trigger}
        id={id}
        type="button"
        data-lumo-trigger=""
        data-state={open ? 'open' : 'closed'}
        data-invalid={invalid ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        disabled={disabled}
        /*
         * `role="combobox"`, not a bare button.
         *
         * `aria-activedescendant` is not valid on a button, and Biome was right
         * to reject it. The WAI-ARIA pattern for a control that opens a listbox
         * and keeps focus on the trigger is the **select-only combobox**: the
         * trigger is a combobox, `aria-controls` points at the popup, and the
         * active option is named by id. A button with a listbox attached is a
         * shape assistive technology has no vocabulary for.
         */
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        aria-activedescendant={open ? `${optionId}-${activeIndex}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid ? 'true' : undefined}
        onClick={() => {
          setActiveIndex(selectedIndex)
          setOpen((was) => !was)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (!open) onBlur?.()
        }}
      >
        <span data-lumo-value="">{selected?.label ?? ''}</span>
        <span data-lumo-indicator="" aria-hidden="true" />
      </button>

      {open && (
        <div ref={popup} id={popupId} role="listbox" data-lumo-popup="" tabIndex={-1}>
          {options.map((option, index) => (
            /*
             * biome-ignore lint/a11y/useFocusableInteractive: an option in an
             * `aria-activedescendant` listbox must NOT be focusable. Focus stays
             * on the trigger for the whole interaction — that is the pattern —
             * and the active option is communicated by id instead. Adding
             * `tabIndex` would put every option in the tab order and break the
             * thing the rule is trying to protect.
             */
            <div
              key={option.value}
              id={`${optionId}-${index}`}
              role="option"
              data-lumo-option=""
              data-highlighted={index === activeIndex ? '' : undefined}
              data-selected={index === selectedIndex ? '' : undefined}
              data-disabled={option.disabled ? '' : undefined}
              aria-selected={index === selectedIndex}
              aria-disabled={option.disabled ? 'true' : undefined}
              /*
               * `onPointerDown` with `preventDefault`, not `onClick`. A click
               * blurs the trigger first, and the blur handler would run a
               * validation pass against the old value on the way past.
               */
              onPointerDown={(event) => {
                event.preventDefault()
                commit(index)
              }}
              onPointerEnter={() => !option.disabled && setActiveIndex(index)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
