'use client';

interface UrlPrefillOptionsProps {
  urls: string[];
  value: string;
  onSelect: (url: string) => void;
  label: string;
}

export function UrlPrefillOptions({ urls, value, onSelect, label }: UrlPrefillOptionsProps) {
  return (
    <div role="group" aria-label={label} className="mt-2 flex flex-wrap gap-2">
      {urls.map((url) => {
        const isSelected = value.trim() === url;

        return (
          <button
            key={url}
            type="button"
            data-focusable="true"
            aria-pressed={isSelected}
            onClick={() => onSelect(url)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              isSelected
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white'
            }`}
          >
            {url}
          </button>
        );
      })}
    </div>
  );
}
