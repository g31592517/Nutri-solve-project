import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types/user';
import { useAuth } from './AuthContext';

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (profileData: UserProfile) => void;
  getPersonalizedPrompt: () => string;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});

  useEffect(() => {
    // Load profile from localStorage when user changes
    if (user) {
      const storedProfile = localStorage.getItem(`userProfile_${user.id}`);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
    } else {
      setProfile({});
    }
  }, [user]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    
    if (user) {
      localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(updatedProfile));
    }
  };

  const completeOnboarding = (profileData: UserProfile) => {
    const completedProfile = { ...profileData, onboardingCompleted: true };
    setProfile(completedProfile);
    
    if (user) {
      localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(completedProfile));
    }
  };

  const getPersonalizedPrompt = (): string => {
    if (!profile.onboardingCompleted) return '';
    
    const parts: string[] = [];
    
    if (profile.age && profile.gender && profile.weight) {
      parts.push(`User is ${profile.age}yo ${profile.gender}, ${profile.weight}kg`);
    }
    
    if (profile.primaryGoal) {
      const goalText = profile.primaryGoal.replace('_', ' ');
      parts.push(`Goal: ${goalText}`);
    }
    
    if (profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0) {
      parts.push(`Dietary restrictions: ${profile.dietaryRestrictions.join(', ')}`);
    }
    
    if (profile.weeklyBudget) {
      parts.push(`Budget: $${profile.weeklyBudget}/week`);
    }
    
    if (profile.favoriteCuisines && profile.favoriteCuisines.length > 0) {
      parts.push(`Prefers: ${profile.favoriteCuisines.join(', ')} cuisine`);
    }
    
    return parts.length > 0 ? `\n\n[User Context: ${parts.join(' | ')}]` : '';
  };

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        updateProfile,
        completeOnboarding,
        getPersonalizedPrompt,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
