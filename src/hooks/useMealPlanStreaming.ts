import { useState, useCallback, useRef } from "react";

export interface MealData {
  id: string;
  name: string;
  type: "breakfast" | "lunch" | "dinner";
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
}

export interface DayData {
  day: string;
  date: string;
  meals: MealData[];
}

export interface StreamingState {
  isGenerating: boolean;
  currentDayIndex: number;
  currentMealIndex: number;
  completedDays: DayData[];
  error: string | null;
}

/**
 * Hook for handling progressive meal plan rendering from streaming backend responses
 * This is the core visual formatting system for AI-generated meal plans
 */
export const useMealPlanStreaming = () => {
  const [state, setState] = useState<StreamingState>({
    isGenerating: false,
    currentDayIndex: -1,
    currentMealIndex: -1,
    completedDays: [],
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start generating meal plan - triggers the progressive rendering
   * This will be called when backend starts streaming data
   */
  const startGeneration = useCallback(() => {
    setState({
      isGenerating: true,
      currentDayIndex: 0,
      currentMealIndex: 0,
      completedDays: [],
      error: null,
    });
    abortControllerRef.current = new AbortController();
  }, []);

  /**
   * Add a new meal to the current day being rendered
   * Called each time backend streams a new meal
   */
  const addMeal = useCallback((dayIndex: number, meal: MealData) => {
    setState((prev) => {
      const newCompletedDays = [...prev.completedDays];
      
      // Ensure day exists
      if (!newCompletedDays[dayIndex]) {
        newCompletedDays[dayIndex] = {
          day: getDayName(dayIndex),
          date: getFormattedDate(dayIndex),
          meals: [],
        };
      }

      // Normalize meal data with defaults
      const normalizedMeal: MealData = {
        id: meal.id || `${getDayName(dayIndex)}-${meal.type}-${Date.now()}`,
        name: meal.name || 'Untitled Meal',
        type: meal.type,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fats: meal.fats || (meal as any).fat || 0, // Handle 'fat' vs 'fats'
        prepTime: meal.prepTime || 20,
        ingredients: meal.ingredients || [],
        instructions: meal.instructions || [`Prepare ${meal.name}`],
      };

      console.log(`✅ Rendering meal: ${normalizedMeal.name} (${normalizedMeal.type}) - ${normalizedMeal.calories} kcal`);

      // Add meal to the day
      newCompletedDays[dayIndex] = {
        ...newCompletedDays[dayIndex],
        meals: [...newCompletedDays[dayIndex].meals, normalizedMeal],
      };

      return {
        ...prev,
        completedDays: newCompletedDays,
        currentDayIndex: dayIndex,
        currentMealIndex: newCompletedDays[dayIndex].meals.length - 1,
      };
    });
  }, []);

  /**
   * Move to next day in the generation sequence
   * Called when backend completes a day and moves to next
   */
  const moveToNextDay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentDayIndex: prev.currentDayIndex + 1,
      currentMealIndex: 0,
    }));
  }, []);

  /**
   * Complete the generation process
   * Called when backend finishes streaming all data
   */
  const completeGeneration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      currentDayIndex: -1,
      currentMealIndex: -1,
    }));
  }, []);

  /**
   * Handle errors during generation
   */
  const setError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      error,
    }));
  }, []);

  /**
   * Reset the entire state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      isGenerating: false,
      currentDayIndex: -1,
      currentMealIndex: -1,
      completedDays: [],
      error: null,
    });
  }, []);

  /**
   * Process streaming response from backend
   * This is the main integration point with your AI backend
   */
  const processStreamingResponse = useCallback(
    async (
      streamUrl: string,
      options?: RequestInit
    ): Promise<void> => {
      try {
        startGeneration();

        const response = await fetch(streamUrl, {
          ...options,
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let buffer = "";
        let currentDay = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            completeGeneration();
            break;
          }

          // Decode chunk
          buffer += decoder.decode(value, { stream: true });

          // Process complete JSON objects from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              // Handle SSE format: "data: {...}"
              const jsonString = line.startsWith('data: ') ? line.slice(6) : line;
              const data = JSON.parse(jsonString);

              // Handle different message types from backend
              if (data.type === "meal") {
                addMeal(currentDay, data.meal);
              } else if (data.type === "day_complete") {
                moveToNextDay();
                currentDay++;
              } else if (data.type === "complete") {
                completeGeneration();
                break;
              } else if (data.type === "error") {
                setError(data.message);
                break;
              }
            } catch (e) {
              console.warn("Failed to parse streaming data:", line);
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Generation aborted");
        } else {
          setError(error.message || "Failed to generate meal plan");
        }
      }
    },
    [startGeneration, addMeal, moveToNextDay, completeGeneration, setError]
  );

  /**
   * Simulate streaming for testing with mock data
   * Remove this in production or keep for demo purposes
   */
  const simulateStreaming = useCallback(
    async (mockData: DayData[]): Promise<void> => {
      startGeneration();

      for (let dayIndex = 0; dayIndex < mockData.length; dayIndex++) {
        const day = mockData[dayIndex];

        for (const meal of day.meals) {
          // Simulate network delay
          await new Promise((resolve) => setTimeout(resolve, 1500));
          addMeal(dayIndex, meal);
        }

        if (dayIndex < mockData.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          moveToNextDay();
        }
      }

      completeGeneration();
    },
    [startGeneration, addMeal, moveToNextDay, completeGeneration]
  );

  return {
    state,
    startGeneration,
    addMeal,
    moveToNextDay,
    completeGeneration,
    setError,
    reset,
    processStreamingResponse,
    simulateStreaming,
  };
};

// Helper functions
function getDayName(index: number): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days[index] || `Day ${index + 1}`;
}

function getFormattedDate(index: number): string {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
