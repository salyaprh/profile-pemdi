interface FilterChipsProps<T extends string> {
  /** Nama grup untuk pembaca layar, mis. "Filter status". */
  label: string;
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
}

/**
 * Pilihan filter tunggal bergaya Chip IDDS (kelas CSS ina-chip). Komponen Chip IDDS tidak memberi
 * tahu pembaca layar chip mana yang sedang aktif (tanpa aria-pressed, WCAG 4.1.2), jadi chip di
 * sini dirender sendiri sebagai tombol toggle dengan aria-pressed.
 */
export default function FilterChips<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="ina-chip">
      <div className="ina-chip__list flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.value)}
              className={`ina-chip__item ina-chip__item--size-small ina-chip__item--variant-outline ${
                active
                  ? 'ina-chip__item--selected !border-primary-600 !bg-primary-50 !text-primary-600'
                  : ''
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
