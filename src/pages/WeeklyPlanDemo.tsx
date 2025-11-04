import { useState } from "react";
import { WeeklyPlanSection } from "@/components/meal-plan/WeeklyPlanSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const WeeklyPlanDemo = () => {
  const [mode, setMode] = useState<'mock' | 'api'>('mock');
  const [apiEndpoint, setApiEndpoint] = useState('/api/meal-plan/generate');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Weekly Meal Planner - Production System
              </h1>
              <p className="text-muted-foreground">
                Dynamic AI-style rendering system for real-time meal plan generation
              </p>
            </div>
            <Badge variant={mode === 'mock' ? 'secondary' : 'default'} className="text-sm">
              {mode === 'mock' ? '🧪 Testing Mode' : '🚀 Production Mode'}
            </Badge>
          </div>
          
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'mock' | 'api')} className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="mock">Mock Data (Testing)</TabsTrigger>
              <TabsTrigger value="api">Real API (Production)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="mock" className="mt-4">
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong>Testing Mode:</strong> Uses simulated streaming with mock data to demonstrate the visual behavior.
                  Perfect for testing the UI without a backend.
                </p>
              </Card>
            </TabsContent>
            
            <TabsContent value="api" className="mt-4">
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>Production Mode:</strong> Connects to your real backend API endpoint.
                  The same visual behavior applies to actual AI-generated responses.
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                    placeholder="/api/meal-plan/generate"
                  />
                  <Button size="sm" variant="outline" onClick={() => setApiEndpoint('/api/meal-plan/generate')}>
                    Reset
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <WeeklyPlanSection 
          apiEndpoint={mode === 'api' ? apiEndpoint : undefined}
          useMockData={mode === 'mock'}
          onPlanComplete={() => {
            console.log('Meal plan generation complete!');
          }}
        />
        
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🎨</span> Visual Features
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Progressive Rendering:</strong> Meals appear one by one as backend streams data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Dynamic Layouts:</strong> Monday full-width → Tuesday 2-col → Wednesday+ scrollable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Skeleton Loaders:</strong> Pulsing placeholders during generation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Smooth Animations:</strong> Scale-in and slide-in-scale transitions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Real-time Indicators:</strong> Shows current day and meal count</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Weekly Summary:</strong> Automatic totals calculation on completion</span>
              </li>
            </ul>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>⚙️</span> Technical Features
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Streaming Support:</strong> Handles real-time data from backend AI</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>NDJSON Protocol:</strong> Processes newline-delimited JSON streams</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Error Handling:</strong> Graceful error recovery with retry</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Abort Support:</strong> Can cancel generation mid-stream</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>State Management:</strong> Tracks generation progress in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span><strong>Production Ready:</strong> Same system for mock and real data</span>
              </li>
            </ul>
          </Card>
        </div>
        
        <Card className="mt-6 p-6 bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span>📚</span> Integration Documentation
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            See <code className="px-2 py-1 bg-muted rounded text-xs">BACKEND_INTEGRATION.md</code> for complete backend integration guide with examples in Node.js, Python, and more.
          </p>
          <div className="flex gap-2">
            <Badge variant="outline">Streaming API</Badge>
            <Badge variant="outline">NDJSON Format</Badge>
            <Badge variant="outline">Real-time Updates</Badge>
            <Badge variant="outline">Error Recovery</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WeeklyPlanDemo;
