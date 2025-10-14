import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGamification } from "@/contexts/GamificationContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Flame, Trophy, Target, Award, Calendar, TrendingUp } from "lucide-react";
import { Badge, Challenge } from "@/types/user";

interface UserDashboardProps {
  onEditProfile?: () => void;
  onViewChallenge?: (challenge: Challenge) => void;
}

export const UserDashboard = ({ onEditProfile, onViewChallenge }: UserDashboardProps) => {
  const { gamification, joinChallenge } = useGamification();
  const { profile } = useUserProfile();

  const getBadgeEmoji = (badge: Badge) => {
    return badge.icon || '🏆';
  };

  const getGoalDisplay = () => {
    if (!profile.primaryGoal) return 'Not set';
    return profile.primaryGoal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStreakColor = () => {
    if (gamification.streaks.currentStreak >= 7) return 'text-orange-500';
    if (gamification.streaks.currentStreak >= 3) return 'text-yellow-500';
    return 'text-primary';
  };

  return (
    <div className="space-y-6">
      {/* Streak & Progress Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Streak */}
        <Card className="border-2 bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className={`h-5 w-5 ${getStreakColor()}`} />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">
                {gamification.streaks.currentStreak}
                <span className="text-2xl ml-2">🔥</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Longest: {gamification.streaks.longestStreak} days
              </p>
              {gamification.streaks.currentStreak >= 7 && (
                <BadgeUI className="mt-3 bg-orange-500">On Fire! 🔥</BadgeUI>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card className="border-2 bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{gamification.weeklyProgress.daysLogged} of {gamification.weeklyProgress.targetDays} days</span>
                <span className="font-bold">{Math.round((gamification.weeklyProgress.daysLogged / gamification.weeklyProgress.targetDays) * 100)}%</span>
              </div>
              <Progress 
                value={(gamification.weeklyProgress.daysLogged / gamification.weeklyProgress.targetDays) * 100} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                Keep logging daily to maintain your streak!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Overview */}
      <Card className="border-2 bg-gradient-card shadow-elegant">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Goal
            </CardTitle>
            {onEditProfile && (
              <Button variant="outline" size="sm" onClick={onEditProfile}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Primary Goal</p>
              <p className="font-semibold text-lg">{getGoalDisplay()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Points</p>
              <p className="font-semibold text-lg">{gamification.points} pts</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Badges Earned</p>
              <p className="font-semibold text-lg">{gamification.badges.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="border-2 bg-gradient-card shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Badge Collection ({gamification.badges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gamification.badges.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No badges yet. Start engaging to earn your first badge!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gamification.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="group relative bg-primary/5 rounded-lg p-4 text-center hover:bg-primary/10 transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  <div className="text-4xl mb-2 animate-bounce-subtle">
                    {getBadgeEmoji(badge)}
                  </div>
                  <p className="font-semibold text-sm mb-1">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  {badge.unlockedAt && (
                    <p className="text-xs text-primary mt-1">
                      {new Date(badge.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Challenges */}
      <Card className="border-2 bg-gradient-card shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gamification.challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="border-2 border-border rounded-lg p-4 hover:border-primary/50 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{challenge.name}</h4>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                  <BadgeUI variant="secondary">
                    {challenge.participants || 0} joined
                  </BadgeUI>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>{challenge.progress} / {challenge.target} completed</span>
                    <span className="font-bold">{Math.round((challenge.progress / challenge.target) * 100)}%</span>
                  </div>
                  <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                </div>

                {challenge.reward && (
                  <p className="text-xs text-primary mb-2">🎁 Reward: {challenge.reward}</p>
                )}

                <div className="flex gap-2">
                  {challenge.progress === 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => joinChallenge(challenge.id)}
                      className="flex-1"
                    >
                      Join Challenge
                    </Button>
                  )}
                  {onViewChallenge && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onViewChallenge(challenge)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
