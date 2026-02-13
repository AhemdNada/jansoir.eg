import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Accessible listbox-style governorate selector that always renders downward.
 * options: [{ value: string, label: string }]
 */
const GovernorateSelect = ({
  label,
  placeholder = 'اختر المحافظة…',
  options = [],
  value,
  onChange,
  disabled = false,
  error = '',
  onRefresh,
  refreshDisabled = false,
}) => {
  const id = useId();
  const buttonId = `${id}-button`;
  const listboxId = `${id}-listbox`;

  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const computeInitialIndex = () => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  };

  const openList = () => {
    setActiveIndex(computeInitialIndex());
    setOpen(true);
  };

  const safeActiveIndex = options.length ? Math.min(Math.max(activeIndex, 0), options.length - 1) : -1;

  const commit = (nextValue) => {
    onChange?.(nextValue);
    setOpen(false);
    // keep focus for keyboard users
    setTimeout(() => buttonRef.current?.focus(), 0);
  };

  const move = (delta) => {
    if (!options.length) return;
    setActiveIndex((prev) => {
      const base = prev < 0 ? 0 : Math.min(Math.max(prev, 0), options.length - 1);
      const next = (base + delta + options.length) % options.length;
      return next;
    });
  };

  const onButtonKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) openList();
      else move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) openList();
      else move(-1);
    } else if (e.key === 'Home') {
      if (!open) return;
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      if (!open) return;
      e.preventDefault();
      setActiveIndex(Math.max(0, options.length - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        openList();
      } else if (safeActiveIndex >= 0 && options[safeActiveIndex]) {
        commit(options[safeActiveIndex].value);
      }
    } else if (e.key === 'Escape') {
      if (!open) return;
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="w-full">
      {label && <label className="block text-xs font-semibold text-beige mb-1">{label}</label>}

      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <button
            ref={buttonRef}
            id={buttonId}
            type="button"
            className="w-full px-3 py-2.5 border border-woody rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold bg-black text-gold text-left"
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-invalid={!!error}
            disabled={disabled}
            onClick={() => {
              if (open) setOpen(false);
              else openList();
            }}
            onKeyDown={onButtonKeyDown}
          >
            <span className={`${selected ? '' : 'text-woody'}`}>{selected ? selected.label : placeholder}</span>
          </button>

          {/* Dropdown always renders downward */}
          {open && (
            <ul
              id={listboxId}
              role="listbox"
              aria-labelledby={buttonId}
              className="absolute left-0 right-0 top-full mt-2 max-h-64 overflow-auto rounded-lg border border-woody bg-black shadow-xl z-[200]"
            >
              {options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-woody">لا توجد محافظات</li>
              ) : (
                options.map((opt, idx) => {
                  const isActive = idx === safeActiveIndex;
                  const isSelected = opt.value === value;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      className={`px-3 py-2 text-sm cursor-pointer ${
                        isActive ? 'bg-gold/20 text-gold' : 'text-beige hover:bg-dark-light'
                      }`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseDown={(e) => {
                        // prevent button blur before click
                        e.preventDefault();
                      }}
                      onClick={() => commit(opt.value)}
                    >
                      {opt.label}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshDisabled}
            className="px-3 py-2.5 rounded-lg border border-woody bg-dark-light text-beige hover:text-gold disabled:opacity-50"
            title="تحديث"
          >
            تحديث
          </button>
        )}
      </div>

      {error && <p className="text-gold text-xs mt-1">{error}</p>}
    </div>
  );
};

export default GovernorateSelect;

