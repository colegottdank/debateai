'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/useTestUser';

export function useAvatar() {
  const { user } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('Anonymous');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Fetch user's custom avatar and display name from database
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        }
        if (data.displayName) {
          setDisplayName(data.displayName);
        }
      })
      .catch(err => {
        console.error('Failed to fetch profile:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user]);

  // Return custom avatar or placeholder (NOT using Clerk's imageUrl to avoid personal images)
  const displayAvatar = avatarUrl || 'https://img.clerk.com/preview.png?size=144&seed=anonymous&initials=AN&isSquare=true&bgType=marble&bgColor=6B46C1&fgType=silhouette&fgColor=FFFFFF';

  return {
    avatarUrl: displayAvatar,
    customAvatarUrl: avatarUrl,
    displayName,
    isLoading,
    setAvatarUrl,
    setDisplayName,
  };
}