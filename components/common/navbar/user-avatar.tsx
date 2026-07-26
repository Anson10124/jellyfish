'use client';

import React, { useState, useEffect } from 'react';
import { normalizeServerUrl } from '@/lib/api/fetch-client';

interface UserAvatarProps {
  serverUrl?: string;
  userId?: string;
  tag?: string;
  username?: string;
}

export function UserAvatar({ serverUrl, userId, tag, username }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [serverUrl, userId, tag]);

  if (serverUrl && userId && !hasError) {
    const base = normalizeServerUrl(serverUrl);
    const avatarUrl = `${base}/Users/${userId}/Images/Primary${tag ? `?tag=${tag}` : ''}`;
    return (
      <img
        src={avatarUrl}
        alt={username || 'User'}
        onError={() => setHasError(true)}
        className="w-4 h-4 rounded-full object-cover shrink-0"
      />
    );
  }

  const initial = username ? username.charAt(0).toUpperCase() : '?';
  return (
    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0 leading-none">
      {initial}
    </div>
  );
}
