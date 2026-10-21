'use client';

interface UrlPrefillOptionsProps {
  urls: string[];
  value: string;
  onSelect: (url: string) => void;
  label: string;
  disabled?: boolean;
}

export function UrlPrefillOptions({ urls, value, onSelect, label, disabled }: UrlPrefillOptionsProps) {
  return (
    <div role="group" aria-label={label} className="mt-2 flex flex-wrap gap-2">
      {urls.map((url) => {
        const isSelected = value.trim() === url;

        return (
          <button
            key={url}
            type="button"
            disabled={disabled}
            data-focusable="true"
            aria-pressed={isSelected}
            onClick={() => onSelect(url)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${
              isSelected
                ? 'border-foreground/30 bg-foreground/15 text-foreground'
                : 'border-foreground/10 bg-foreground/5 text-foreground/60 hover:border-foreground/20 hover:bg-foreground/10 hover:text-foreground'
            }`}
          >
            {url}
          </button>
        );
      })}
    </div>
  );
}
