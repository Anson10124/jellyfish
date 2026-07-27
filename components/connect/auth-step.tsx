'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { AuthMethod, QuickConnectStatus, ServerInfo } from '@/hooks/connect/use-connect-flow';
import { slideVariants } from './server-step';
import { AuthCard } from './auth-card';
import { useTranslation } from '@/hooks/ui/use-translation';

interface AuthStepProps {
  direction: number;
  serverUrl: string;
  serverInfo: ServerInfo | null;
  selectedMethod: AuthMethod;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  authError: string | null;
  quickConnectCode: string | null;
  isGeneratingQC: boolean;
  qcStatus: QuickConnectStatus;
  qcError: string | null;
  isAuthenticating: boolean;
  canSubmit: boolean;
  onBack: () => void;
  onSelectMethod: (method: AuthMethod) => void;
  onStartQuickConnect: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AuthStep({
  direction,
  serverUrl,
  serverInfo,
  selectedMethod,
  username,
  setUsername,
  password,
  setPassword,
  authError,
  quickConnectCode,
  isGeneratingQC,
  qcStatus,
  qcError,
  isAuthenticating,
  canSubmit,
  onBack,
  onSelectMethod,
  onStartQuickConnect,
  onSubmit,
}: AuthStepProps) {
  const { t } = useTranslation();

  return (
    <motion.main
      key="step-2"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="w-full max-w-4xl flex flex-col items-center z-10"
    >
      <div className="w-full flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white text-sm font-medium transition-all cursor-pointer border border-white/10 backdrop-blur-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('connect.changeServer', 'Change Server')}</span>
        </button>
      </div>

      <div className="text-center max-w-2xl mb-8 space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          {t('connect.loginTitle', 'How would you like to log in?')}
        </h1>
        <p className="text-white/60 text-sm font-normal">
          {t('connect.loginSubtitle', 'Choose your preferred login method for')}{' '}
          <strong className="text-white">{serverUrl}</strong>
        </p>
      </div>

      <form onSubmit={onSubmit} className="w-full flex flex-col items-center">
        <div className="w-full mb-10">
          <AuthCard
            selectedMethod={selectedMethod}
            onSelectMethod={onSelectMethod}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            authError={authError}
            quickConnectCode={quickConnectCode}
            isGeneratingQC={isGeneratingQC}
            qcStatus={qcStatus}
            qcError={qcError}
            onStartQuickConnect={onStartQuickConnect}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || isAuthenticating}
          className={`group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full font-bold text-base transition-all duration-300 cursor-pointer ${
            canSubmit && !isAuthenticating
              ? 'bg-white text-black scale-100 hover:scale-105 active:scale-95'
              : 'bg-white/10 text-white/50 cursor-not-allowed scale-95 opacity-50'
          }`}
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-black" />
              <span>{t('connect.connecting', 'Connecting...')}</span>
            </>
          ) : (
            <>
              <span>{t('connect.letsStart', "Let's start")}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </motion.main>
  );
}
