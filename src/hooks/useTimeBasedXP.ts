import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/safeClient';
import { useToast } from '@/hooks/use-toast';

const XP_PER_MINUTE = 2; // 2 XP per minute spent in app
const XP_INTERVAL_MS = 60000; // 1 minute
const XP_FOR_LEVEL_UP = 500;

export function useTimeBasedXP() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !profile) return;

    const awardXP = async () => {
      try {
        const newXp = profile.xp + XP_PER_MINUTE;
        
        if (newXp >= XP_FOR_LEVEL_UP) {
          // Level up
          const { error } = await supabase
            .from('profiles')
            .update({
              xp: newXp - XP_FOR_LEVEL_UP,
              level: profile.level + 1,
            })
            .eq('id', user.id);

          if (!error) {
            toast({
              title: '🎉 Level Up!',
              description: `You've reached Level ${profile.level + 1}!`,
            });
            await refreshProfile();
          }
        } else {
          // Just add XP
          const { error } = await supabase
            .from('profiles')
            .update({ xp: newXp })
            .eq('id', user.id);

          if (!error) {
            await refreshProfile();
          }
        }
      } catch (error) {
        console.error('Error awarding time-based XP:', error);
      }
    };

    // Start the interval
    intervalRef.current = setInterval(awardXP, XP_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, profile?.xp, profile?.level]);

  return null;
}
