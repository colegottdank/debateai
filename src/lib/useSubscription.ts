import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface SubscriptionData {
  isPremium: boolean;
  isLoading: boolean;
  debatesUsed?: number;
  debatesLimit?: number;
}

export function useSubscription(): SubscriptionData {
  const { isSignedIn } = useUser();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    isPremium: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSignedIn) {
        setSubscriptionData({ isPremium: false, isLoading: false });
        return;
      }

      try {
        const response = await fetch('/api/subscription');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData({
            isPremium: data.isPremium || false,
            isLoading: false,
            debatesUsed: data.debatesUsed,
            debatesLimit: data.debatesLimit,
          });
        } else {
          setSubscriptionData({ isPremium: false, isLoading: false });
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionData({ isPremium: false, isLoading: false });
      }
    };

    checkSubscription();
  }, [isSignedIn]);

  return subscriptionData;
}