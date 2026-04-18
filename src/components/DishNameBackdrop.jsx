/**
 * Decorative dish name display for cards and hero rows.
 */
export default function DishNameBackdrop({ name, variant = 'default' }) {
  const compact = variant === 'compact';
  return (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden px-2 bg-gradient-to-br from-orange-50 via-amber-50/90 to-rose-50/80 ${
        compact ? 'py-2' : 'py-4'
      }`}
      aria-hidden
    >
      <span
        className={`max-w-full text-center font-display font-bold leading-[1.02] tracking-[-0.03em] transition duration-500 ease-out select-none [overflow-wrap:anywhere] line-clamp-2 bg-gradient-to-br from-delivery-700/95 to-flame-600/85 bg-clip-text text-transparent ${
          compact ? 'text-sm md:text-base' : 'text-lg md:text-xl'
        }`}
      >
        {name || '—'}
      </span>
    </div>
  );
}
