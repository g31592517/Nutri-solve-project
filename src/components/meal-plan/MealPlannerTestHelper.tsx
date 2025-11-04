/**
 * Meal Planner Test Helper Component
 * 
 * This component provides a UI for testing the meal planner functionality
 * with detailed logging and validation.
 * 
 * Usage: Add to your app temporarily for testing
 * <MealPlannerTestHelper />
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

interface TestLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export const MealPlannerTestHelper = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [metrics, setMetrics] = useState({
    totalTime: 0,
    daysGenerated: 0,
    avgTimePerDay: 0,
    statusUpdates: 0,
  });

  const addLog = (type: TestLog['type'], message: string) => {
    const log: TestLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs(prev => [...prev, log]);
  };

  const testProfile = {
    age: 28,
    gender: 'female',
    weight: 65,
    activityLevel: 'moderate',
    primaryGoal: 'weight_loss',
    dietaryRestrictions: ['vegetarian'],
  };

  const runTest = async () => {
    setIsRunning(true);
    setLogs([]);
    setTestResults({});
    setMetrics({ totalTime: 0, daysGenerated: 0, avgTimePerDay: 0, statusUpdates: 0 });

    addLog('info', '🚀 Starting meal planner test...');
    addLog('info', `Profile: ${testProfile.age}yo ${testProfile.gender}, ${testProfile.weight}kg`);
    addLog('info', `Goal: ${testProfile.primaryGoal}, Restrictions: ${testProfile.dietaryRestrictions.join(', ')}`);

    const startTime = Date.now();
    let dayCount = 0;
    let statusCount = 0;
    const days: any[] = [];

    try {
      addLog('info', '📡 Sending request to /api/meal-plan/generate-stream');

      const response = await fetch('/api/meal-plan/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: testProfile,
          budget: '50-100',
          preferences: 'light dinners, high protein breakfast',
          varietyMode: 'varied',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      addLog('success', '✅ Connection established (SSE)');
      addLog('info', '⏳ Waiting for streaming data...');

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              addLog('success', '✅ Stream completed');
              break;
            }

            try {
              const event = JSON.parse(data);

              if (event.type === 'status') {
                statusCount++;
                addLog('info', `📊 ${event.message} (${event.progress}%)`);
              } else if (event.type === 'day_complete') {
                dayCount++;
                days.push(event.day);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                addLog('success', `✅ Day ${dayCount}/7: ${event.day.day} completed in ${elapsed}s`);
                addLog('info', `   Meals: ${event.day.meals.length}, Calories: ${event.day.totalCalories}, Protein: ${event.day.totalProtein}g`);
              } else if (event.type === 'complete') {
                addLog('success', '🎉 Meal plan generation complete!');
                addLog('info', `   Total days: ${event.mealPlan.days.length}`);
                addLog('info', `   Weekly calories: ${event.mealPlan.weeklyTotals.calories}`);
                addLog('info', `   Weekly protein: ${event.mealPlan.weeklyTotals.protein}g`);
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch (parseError) {
              addLog('warning', `⚠️ Failed to parse event: ${data}`);
            }
          }
        }
      }

      const totalTime = (Date.now() - startTime) / 1000;
      const avgTime = totalTime / dayCount;

      setMetrics({
        totalTime: parseFloat(totalTime.toFixed(2)),
        daysGenerated: dayCount,
        avgTimePerDay: parseFloat(avgTime.toFixed(2)),
        statusUpdates: statusCount,
      });

      // Run validations
      addLog('info', '🔍 Running validation checks...');

      const validations = {
        'All 7 days generated': dayCount === 7,
        'Each day has 3 meals': days.every(d => d.meals.length === 3),
        'All meals have names': days.every(d => d.meals.every((m: any) => m.name)),
        'All meals have calories': days.every(d => d.meals.every((m: any) => m.calories > 0)),
        'All meals have protein': days.every(d => d.meals.every((m: any) => m.protein > 0)),
        'All meals have ingredients': days.every(d => d.meals.every((m: any) => m.ingredients?.length > 0)),
        'Vegetarian meals only': days.every(d => d.meals.every((m: any) => 
          !m.name.toLowerCase().includes('chicken') &&
          !m.name.toLowerCase().includes('beef') &&
          !m.name.toLowerCase().includes('pork') &&
          !m.name.toLowerCase().includes('fish')
        )),
        'No phi3 references': !JSON.stringify(days).toLowerCase().includes('phi3'),
      };

      setTestResults(validations);

      Object.entries(validations).forEach(([check, passed]) => {
        addLog(passed ? 'success' : 'error', `${passed ? '✅' : '❌'} ${check}`);
      });

      const allPassed = Object.values(validations).every(v => v);
      if (allPassed) {
        addLog('success', '🎉 All validation checks passed!');
      } else {
        addLog('error', '⚠️ Some validation checks failed');
      }

    } catch (error: any) {
      addLog('error', `❌ Test failed: ${error.message}`);
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getLogIcon = (type: TestLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Zap className="w-4 h-4 text-blue-600" />;
    }
  };

  const getLogColor = (type: TestLog['type']) => {
    switch (type) {
      case 'success': return 'text-green-700 bg-green-50';
      case 'error': return 'text-red-700 bg-red-50';
      case 'warning': return 'text-yellow-700 bg-yellow-50';
      default: return 'text-blue-700 bg-blue-50';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Meal Planner Test Helper
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automated testing tool for the weekly meal planner feature
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="flex gap-4">
          <Button 
            onClick={runTest} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running Test...' : 'Run Full Test'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLogs([])}
            disabled={isRunning}
          >
            Clear Logs
          </Button>
        </div>

        {/* Metrics */}
        {metrics.totalTime > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Time</p>
              <p className="text-2xl font-bold">{metrics.totalTime}s</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Days Generated</p>
              <p className="text-2xl font-bold">{metrics.daysGenerated}/7</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Avg Per Day</p>
              <p className="text-2xl font-bold">{metrics.avgTimePerDay}s</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Status Updates</p>
              <p className="text-2xl font-bold">{metrics.statusUpdates}</p>
            </div>
          </div>
        )}

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Validation Results</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(testResults).map(([check, passed]) => (
                <Badge 
                  key={check}
                  variant={passed ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {check}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Logs */}
        <div>
          <h3 className="font-semibold mb-3">Test Logs</h3>
          <ScrollArea className="h-96 border rounded-lg p-4 bg-muted/30">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No logs yet. Click "Run Full Test" to start.
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded text-sm ${getLogColor(log.type)}`}
                  >
                    {getLogIcon(log.type)}
                    <span className="text-xs text-muted-foreground min-w-[70px]">
                      {log.timestamp}
                    </span>
                    <span className="flex-1 font-mono text-xs">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Test Instructions</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Ensure Ollama is running with gemma:2b model</li>
            <li>Ensure backend is running on port 5000</li>
            <li>Click "Run Full Test" to start automated testing</li>
            <li>Watch the logs for real-time progress</li>
            <li>Review validation results after completion</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
