'use client';

import { ConnectionStatus } from './connection-status';

import React from 'react';
import { User, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { AuthMethod, QuickConnectStatus } from '@/hooks/connect/use-connect-flow';
import { useTranslation } from '@/hooks/ui/use-translation';

interface AuthCardProps {
  selectedMethod: AuthMethod;
  onSelectMethod: (method: AuthMethod) => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  authError: string | null;
  quickConnectCode: string | null;
  isGeneratingQC: boolean;
  qcStatus: QuickConnectStatus;
  qcError: string | null;
  onStartQuickConnect: () => void;
}

export function AuthCard({
  selectedMethod,
  onSelectMethod,
  username,
  setUsername,
  password,
  setPassword,
  authError,
  quickConnectCode,
  isGeneratingQC,
  qcStatus,
  qcError,
  onStartQuickConnect,
}: AuthCardProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Username & Password Card */}
      <div
        onClick={() => onSelectMethod('credentials')}
        className={`group relative flex flex-col rounded-3xl p-6 transition-all duration-300 border backdrop-blur-xl cursor-pointer min-h-[300px] ${selectedMethod === 'credentials' ? 'border-foreground/30 bg-foreground/[0.08] shadow-2xl' : 'border-foreground/10 hover:border-foreground/20 bg-foreground/5 hover:bg-foreground/[0.08] shadow-xl'}`}
      >
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t('connect.credentialsTitle', 'Username and password')}
        </h2>
        <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
          {t('connect.credentialsDesc', 'Log in directly using your standard Jellyfin account credentials.')}
        </p>

        <div className="mt-auto space-y-3 pt-4 border-t border-foreground/10">
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-4 h-4 text-foreground/60" />
            <input
              type="text"
              data-focusable="true"
              placeholder={t('connect.usernamePlaceholder', 'Username')}
              value={username}
              onChange={(e) => {
                onSelectMethod('credentials');
                setUsername(e.target.value);
              }}
              onFocus={() => onSelectMethod('credentials')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm outline-none placeholder:text-foreground/60 focus:border-foreground/30 focus-visible:ring-2 focus-visible:ring-foreground transition-all"
            />
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-foreground/60" />
            <input
              type="password"
              data-focusable="true"
              placeholder={t('connect.passwordPlaceholder', 'Password (optional if none set)')}
              value={password}
              onChange={(e) => {
                onSelectMethod('credentials');
                setPassword(e.target.value);
              }}
              onFocus={() => onSelectMethod('credentials')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm outline-none placeholder:text-foreground/60 focus:border-foreground/30 focus-visible:ring-2 focus-visible:ring-foreground transition-all"
            />
          </div>

          {authError && (
            <ConnectionStatus>{authError}</ConnectionStatus>
          )}
        </div>
      </div>

      {/* Quick Connect Card */}
      <div
        onClick={() => onSelectMethod('quickconnect')}
        className={`group relative flex flex-col rounded-3xl p-6 transition-all duration-300 border backdrop-blur-xl cursor-pointer min-h-[300px] ${selectedMethod === 'quickconnect' ? 'border-foreground/30 bg-foreground/[0.08] shadow-2xl' : 'border-foreground/10 hover:border-foreground/20 bg-foreground/5 hover:bg-foreground/[0.08] shadow-xl'}`}
      >
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t('connect.quickConnectTitle', 'Quick Connect')}
        </h2>
        <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
          {t('connect.quickConnectDesc', 'Log in without entering your username and password. This method requires approval on your Jellyfin server.')}
        </p>

        <div className="mt-auto space-y-3 pt-4 border-t border-foreground/10">
          {isGeneratingQC ? (
            <div className="flex items-center justify-center gap-2 py-4 text-foreground/60 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-foreground" />
              <span>{t('connect.generatingQc', 'Generating Quick Connect Code...')}</span>
            </div>
          ) : quickConnectCode ? (
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-foreground/5 border border-foreground/10">
              <span className="text-xs text-foreground/60 font-medium mb-1">
                {t('connect.yourQcCode', 'Your Quick Connect Code')}
              </span>
              <div className="text-3xl font-mono font-extrabold tracking-widest text-foreground my-1">
                {quickConnectCode}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {qcStatus === 'authorized' ? (
                  <span className="text-foreground font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('connect.qcAuthorized', "Authorized! Click Let's start below.")}
                  </span>
                ) : (
                  <span className="text-foreground/60 font-medium flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t('connect.qcWaiting', 'Waiting for approval on server...')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-focusable="true"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedMethod === 'quickconnect') onStartQuickConnect();
                else onSelectMethod('quickconnect');
              }}
              className="w-full py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 active:scale-95 text-foreground text-sm font-medium transition-all duration-200 cursor-pointer border border-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              {t('connect.generateQcCode', 'Generate Quick Connect Code')}
            </button>
          )}

          {qcError && (
            <ConnectionStatus>{qcError}</ConnectionStatus>
          )}
        </div>
      </div>
    </div>
  );
}
