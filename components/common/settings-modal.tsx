'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { X, Settings, Monitor, Sun, Moon, ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Tooltip } from '@/components/ui/tooltip';

import { useTranslation } from '@/hooks/ui/use-translation';
import { useScrollLock } from '@/hooks/ui/use-scroll-lock';
import { useShowNsfw } from '@/hooks/ui/use-show-nsfw';
import { useReduceMotion } from '@/hooks/ui/use-reduce-motion';
import { SUPPORTED_LANGUAGES, Locale } from '@/lib/i18n/config';

type SettingsCategory = 'general';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_OPTIONS = [
  { value: 'system', icon: Monitor, labelKey: 'settings.themeSystem', fallback: 'System' },
  { value: 'light', icon: Sun, labelKey: 'settings.themeLight', fallback: 'Light' },
  { value: 'dark', icon: Moon, labelKey: 'settings.themeDark', fallback: 'Dark' },
] as const;

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState<SettingsCategory>('general');

  useScrollLock(isOpen);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  const categories = [
    { id: 'general' as const, icon: Settings, label: t('settings.general', 'General') },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col md:flex-row w-full max-w-3xl h-[min(560px,calc(100dvh-2rem))] rounded-2xl bg-popover border border-border shadow-2xl overflow-hidden"
          >
            {/* Category sidebar */}
            <aside className="shrink-0 md:w-52 border-b md:border-b-0 md:border-r border-border p-3 md:p-4">
              <h2 id="settings-modal-title" className="px-2 mb-2 text-[11px] font-medium text-foreground/50">
                {t('settings.title', 'Settings')}
              </h2>
              <nav className="flex md:flex-col gap-0.5">
                {categories.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    data-focusable="true"
                    onClick={() => setCategory(id)}
                    aria-current={category === id ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground ${
                      category === id
                        ? 'bg-foreground/10 text-foreground'
                        : 'text-foreground/70 hover:text-foreground hover:bg-foreground/[0.06]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Category content */}
            <div className="flex-1 min-w-0 overflow-y-auto px-5 md:px-6 pt-5 pb-6">
              {category === 'general' && <GeneralSettings />}
            </div>

            <button
              type="button"
              data-focusable="true"
              onClick={onClose}
              aria-label={t('settings.close', 'Close settings')}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function GeneralSettings() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [showNsfw, setShowNsfw] = useShowNsfw();
  const [reduceMotion, setReduceMotion] = useReduceMotion();
  const currentLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === locale)?.label ?? 'English';

  return (
    <div className="space-y-8">
      <SettingsSection title={t('settings.appearance', 'Appearance')}>
        <SettingsRow
          label={t('settings.theme', 'Theme')}
          description={t('settings.themeDescription', 'Choose how Jellyfish looks on this device.')}
        >
          <div
            role="radiogroup"
            aria-label={t('settings.theme', 'Theme')}
            className="flex items-center gap-0.5 p-0.5 rounded-xl bg-foreground/[0.06] border border-border"
          >
            {THEME_OPTIONS.map(({ value, icon: Icon, labelKey, fallback }) => {
              const isActive = theme === value;
              const label = t(labelKey, fallback);
              return (
                <Tooltip key={value} content={label}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={label}
                    data-focusable="true"
                    onClick={() => setTheme(value)}
                    className={`p-1.5 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground ${
                      isActive
                        ? 'bg-foreground/15 text-foreground shadow-sm'
                        : 'text-foreground/50 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </SettingsRow>
        <SettingsRow
          label={t('settings.reduceMotion', 'Reduce motion')}
          description={t('settings.reduceMotionDescription', 'Minimize animations and transitions throughout the app.')}
        >
          <SettingsSwitch
            checked={reduceMotion}
            onCheckedChange={setReduceMotion}
            label={t('settings.reduceMotion', 'Reduce motion')}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('settings.display', 'Display')}>
        <SettingsRow
          label={t('settings.language', 'Language')}
          description={t('settings.languageDescription', 'Language used for the interface and media info.')}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              data-focusable="true"
              aria-label={t('settings.language', 'Language')}
              className="group inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-xl text-sm font-medium text-foreground hover:bg-foreground/[0.06] data-popup-open:bg-foreground/[0.06] transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
            >
              <span>{currentLanguage}</span>
              <ChevronDown className="w-3.5 h-3.5 text-foreground/60 transition-transform duration-150 group-data-popup-open:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              positionerClassName="z-[210]"
              className="w-auto min-w-48 max-h-72 rounded-xl p-1 shadow-2xl ring-border"
            >
              <DropdownMenuRadioGroup value={locale} onValueChange={(value) => setLocale(value as Locale)}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <DropdownMenuRadioItem
                    key={lang.code}
                    value={lang.code}
                    closeOnClick
                    className="py-2 pl-2.5 pr-9 rounded-lg text-sm cursor-pointer [&_[data-slot=dropdown-menu-radio-item-indicator]]:right-2.5 [&_[data-slot=dropdown-menu-radio-item-indicator]_svg]:text-tint"
                  >
                    {lang.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingsRow>
        <SettingsRow
          label={t('settings.nsfw', 'Show NSFW content')}
          description={t('settings.nsfwDescription', 'Include adult titles from TMDb in browse, search and recommendations.')}
        >
          <SettingsSwitch
            checked={showNsfw}
            onCheckedChange={setShowNsfw}
            label={t('settings.nsfw', 'Show NSFW content')}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

function SettingsSwitch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-focusable="true"
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-10 items-center rounded-full border border-border transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground ${
        checked ? 'bg-tint' : 'bg-foreground/[0.12]'
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 rounded-full shadow-sm transition-transform duration-150 ${
          checked ? 'translate-x-[18px] bg-background' : 'translate-x-[3px] bg-foreground/70'
        }`}
      />
    </button>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-foreground/50 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
