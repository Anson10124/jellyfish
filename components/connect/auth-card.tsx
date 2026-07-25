'use client';

import React from 'react';
import { User, Lock, Zap, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { AuthMethod, QuickConnectStatus } from '@/hooks/use-connect-flow';
import { useTranslation } from '@/hooks/use-translation';

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
        className="group relative flex flex-col rounded-3xl p-6 transition-all duration-300 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/[0.08] shadow-xl backdrop-blur-xl cursor-pointer min-h-[300px]"
      >
        <h2 className="text-xl font-bold text-white mb-2">
          {t('connect.credentialsTitle', 'Username and password')}
        </h2>
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          {t('connect.credentialsDesc', 'Log in directly using your standard Jellyfin account credentials.')}
        </p>

        <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder={t('connect.usernamePlaceholder', 'Username')}
              value={username}
              onChange={(e) => {
                onSelectMethod('credentials');
                setUsername(e.target.value);
              }}
              onFocus={() => onSelectMethod('credentials')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/60 focus:border-white/30 transition-all"
            />
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-white/60" />
            <input
              type="password"
              placeholder={t('connect.passwordPlaceholder', 'Password (optional if none set)')}
              value={password}
              onChange={(e) => {
                onSelectMethod('credentials');
                setPassword(e.target.value);
              }}
              onFocus={() => onSelectMethod('credentials')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/60 focus:border-white/30 transition-all"
            />
          </div>

          {authError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{authError}</span>
            </p>
          )}
        </div>
      </div>

      {/* Quick Connect Card */}
      <div
        onClick={() => onSelectMethod('quickconnect')}
        className="group relative flex flex-col rounded-3xl p-6 transition-all duration-300 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/[0.08] shadow-xl backdrop-blur-xl cursor-pointer min-h-[300px]"
      >
        <h2 className="text-xl font-bold text-white mb-2">
          {t('connect.quickConnectTitle', 'Quick Connect')}
        </h2>
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          {t('connect.quickConnectDesc', 'Log in without entering your username and password. This method requires approval on your Jellyfin server.')}
        </p>

        <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
          {isGeneratingQC ? (
            <div className="flex items-center justify-center gap-2 py-4 text-white/60 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{t('connect.generatingQc', 'Generating Quick Connect Code...')}</span>
            </div>
          ) : quickConnectCode ? (
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 font-medium mb-1">
                {t('connect.yourQcCode', 'Your Quick Connect Code')}
              </span>
              <div className="text-3xl font-mono font-extrabold tracking-widest text-white my-1">
                {quickConnectCode}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {qcStatus === 'authorized' ? (
                  <span className="text-white font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('connect.qcAuthorized', "Authorized! Click Let's start below.")}
                  </span>
                ) : (
                  <span className="text-white/60 font-medium flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t('connect.qcWaiting', 'Waiting for approval on server...')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMethod('quickconnect');
                onStartQuickConnect();
              }}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-sm font-medium transition-all duration-200 cursor-pointer border border-white/10"
            >
              {t('connect.generateQcCode', 'Generate Quick Connect Code')}
            </button>
          )}

          {qcError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{qcError}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
