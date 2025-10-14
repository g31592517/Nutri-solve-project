import React, { createContext, useContext, useState, useEffect } from 'react';
import { GamificationData, Badge, Challenge, DailyAction, MealLog } from '@/types/user';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GamificationContextType {
  gamification: GamificationData;
  logAction: (action: DailyAction) => void;
  logMeal: (meal: Omit<MealLog, 'id'>) => void;
  joinChallenge: (challengeId: string) => void;
  updateChallengeProgress: (challengeId: string, progress: number) => void;
  checkAndAwardBadges: () => void;
}

const defaultBadges: Badge[] = [
  { id: 'first_chat', name: 'First Chat', description: 'Send your first AI chat message', icon: '💬', category: 'chat' },
  { id: 'chat_master', name: 'Chat Master', description: 'Have 10 AI conversations', icon: '🎓', category: 'chat' },
  { id: 'community_starter', name: 'Community Starter', description: 'Create your first post', icon: '📝', category: 'community' },
  { id: 'allergy_expert', name: 'Allergy Expert', description: 'Share 5 allergy-safe recipes', icon: '🛡️', category: 'community' },
  { id: 'budget_boss', name: 'Budget Boss', description: 'Log 7 budget-friendly meals', icon: '💰', category: 'tracking' },
  { id: 'week_warrior', name: 'Week Warrior', description: 'Maintain 7-day streak', icon: '🔥', category: 'tracking' },
  { id: 'knowledge_seeker', name: 'Knowledge Seeker', description: 'Use 3 educational resources', icon: '📚', category: 'education' },
  { id: 'myth_buster', name: 'Myth Buster', description: 'Read 5 nutrition myths', icon: '💡', category: 'education' },
  { id: 'challenge_champion', name: 'Challenge Champion', description: 'Complete your first challenge', icon: '🏆', category: 'challenge' },
];

const defaultChallenges: Challenge[] = [
  {
    id: 'breakfast_7day',
    name: '7-Day Healthy Breakfast Challenge',
    description: 'Start your day right with nutritious breakfasts',
    type: 'weekly',
    progress: 0,
    target: 7,
    participants: 156,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    reward: 'Breakfast Master Badge',
  },
  {
    id: 'budget_meals',
    name: 'Budget-Friendly Meals Week',
    description: 'Share and discover affordable, nutritious recipes',
    type: 'weekly',
    progress: 0,
    target: 5,
    participants: 203,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    reward: 'Budget Boss Badge',
  },
  {
    id: 'water_intake',
    name: 'Hydration Hero',
    description: 'Track your daily water intake',
    type: 'ongoing',
    progress: 0,
    target: 30,
    participants: 342,
    startDate: new Date().toISOString(),
    reward: 'Hydration Hero Badge',
  },
];

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gamification, setGamification] = useState<GamificationData>({
    streaks: {
      currentStreak: 0,
      longestStreak: 0,
      lastActionDate: null,
    },
    weeklyProgress: {
      daysLogged: 0,
      targetDays: 7,
    },
    badges: [],
    challenges: defaultChallenges,
    points: 0,
    dailyActions: [],
  });

  useEffect(() => {
    // Load gamification data from localStorage when user changes
    if (user) {
      const storedData = localStorage.getItem(`gamification_${user.id}`);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setGamification({
          ...parsed,
          challenges: defaultChallenges.map(dc => {
            const existing = parsed.challenges?.find((c: Challenge) => c.id === dc.id);
            return existing || dc;
          }),
        });
      }
    } else {
      setGamification({
        streaks: { currentStreak: 0, longestStreak: 0, lastActionDate: null },
        weeklyProgress: { daysLogged: 0, targetDays: 7 },
        badges: [],
        challenges: defaultChallenges,
        points: 0,
        dailyActions: [],
      });
    }
  }, [user]);

  const saveData = (data: GamificationData) => {
    if (user) {
      localStorage.setItem(`gamification_${user.id}`, JSON.stringify(data));
    }
  };

  const updateStreak = (actions: DailyAction[]) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    const lastActionDate = actions.length > 0 ? new Date(actions[actions.length - 1].timestamp).toDateString() : null;
    
    let currentStreak = gamification.streaks.currentStreak;
    
    if (lastActionDate === today) {
      // Already logged today
      return;
    } else if (lastActionDate === yesterday || currentStreak === 0) {
      // Continue or start streak
      currentStreak += 1;
    } else {
      // Streak broken
      currentStreak = 1;
    }
    
    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, gamification.streaks.longestStreak),
      lastActionDate: today,
    };
  };

  const logAction = (action: DailyAction) => {
    const updatedActions = [...gamification.dailyActions, action];
    const updatedStreaks = updateStreak(updatedActions) || gamification.streaks;
    
    // Update weekly progress
    const thisWeekActions = updatedActions.filter(a => {
      const actionDate = new Date(a.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return actionDate > weekAgo;
    });
    
    const uniqueDays = new Set(thisWeekActions.map(a => new Date(a.timestamp).toDateString()));
    
    const updatedData: GamificationData = {
      ...gamification,
      dailyActions: updatedActions,
      streaks: updatedStreaks,
      weeklyProgress: {
        daysLogged: uniqueDays.size,
        targetDays: 7,
      },
      points: gamification.points + 10,
    };
    
    setGamification(updatedData);
    saveData(updatedData);
    
    // Show streak notification
    if (updatedStreaks.currentStreak > gamification.streaks.currentStreak) {
      toast({
        title: `🔥 ${updatedStreaks.currentStreak}-Day Streak!`,
        description: 'Keep up the great work!',
      });
    }
  };

  const logMeal = (meal: Omit<MealLog, 'id'>) => {
    const action: DailyAction = {
      type: 'meal_log',
      timestamp: new Date().toISOString(),
      metadata: meal,
    };
    logAction(action);
  };

  const joinChallenge = (challengeId: string) => {
    const updatedChallenges = gamification.challenges.map(c =>
      c.id === challengeId ? { ...c, participants: (c.participants || 0) + 1 } : c
    );
    
    const updatedData = { ...gamification, challenges: updatedChallenges };
    setGamification(updatedData);
    saveData(updatedData);
    
    toast({
      title: '🎯 Challenge Joined!',
      description: 'Good luck on your journey!',
    });
  };

  const updateChallengeProgress = (challengeId: string, progress: number) => {
    const updatedChallenges = gamification.challenges.map(c =>
      c.id === challengeId ? { ...c, progress } : c
    );
    
    const updatedData = { ...gamification, challenges: updatedChallenges };
    setGamification(updatedData);
    saveData(updatedData);
  };

  const checkAndAwardBadges = () => {
    const newBadges: Badge[] = [];
    const unlockedBadgeIds = gamification.badges.map(b => b.id);
    
    // First Chat
    if (!unlockedBadgeIds.includes('first_chat')) {
      const chatActions = gamification.dailyActions.filter(a => a.type === 'chat');
      if (chatActions.length >= 1) {
        const badge = defaultBadges.find(b => b.id === 'first_chat')!;
        newBadges.push({ ...badge, unlockedAt: new Date().toISOString() });
      }
    }
    
    // Chat Master
    if (!unlockedBadgeIds.includes('chat_master')) {
      const chatActions = gamification.dailyActions.filter(a => a.type === 'chat');
      if (chatActions.length >= 10) {
        const badge = defaultBadges.find(b => b.id === 'chat_master')!;
        newBadges.push({ ...badge, unlockedAt: new Date().toISOString() });
      }
    }
    
    // Community Starter
    if (!unlockedBadgeIds.includes('community_starter')) {
      const postActions = gamification.dailyActions.filter(a => a.type === 'community_post');
      if (postActions.length >= 1) {
        const badge = defaultBadges.find(b => b.id === 'community_starter')!;
        newBadges.push({ ...badge, unlockedAt: new Date().toISOString() });
      }
    }
    
    // Week Warrior
    if (!unlockedBadgeIds.includes('week_warrior')) {
      if (gamification.streaks.currentStreak >= 7) {
        const badge = defaultBadges.find(b => b.id === 'week_warrior')!;
        newBadges.push({ ...badge, unlockedAt: new Date().toISOString() });
      }
    }
    
    // Knowledge Seeker
    if (!unlockedBadgeIds.includes('knowledge_seeker')) {
      const eduActions = gamification.dailyActions.filter(a => a.type === 'calculator' || a.type === 'myth_read');
      if (eduActions.length >= 3) {
        const badge = defaultBadges.find(b => b.id === 'knowledge_seeker')!;
        newBadges.push({ ...badge, unlockedAt: new Date().toISOString() });
      }
    }
    
    // Award new badges
    if (newBadges.length > 0) {
      const updatedData = {
        ...gamification,
        badges: [...gamification.badges, ...newBadges],
      };
      setGamification(updatedData);
      saveData(updatedData);
      
      // Show badge notification
      newBadges.forEach(badge => {
        toast({
          title: `🏆 Badge Unlocked: ${badge.name}!`,
          description: badge.description,
          duration: 5000,
        });
      });
    }
  };

  useEffect(() => {
    // Check badges whenever dailyActions changes
    checkAndAwardBadges();
  }, [gamification.dailyActions.length, gamification.streaks.currentStreak]);

  return (
    <GamificationContext.Provider
      value={{
        gamification,
        logAction,
        logMeal,
        joinChallenge,
        updateChallengeProgress,
        checkAndAwardBadges,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
