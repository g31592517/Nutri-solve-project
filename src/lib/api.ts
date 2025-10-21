const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add timeout for all requests (10 minutes for AI operations)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout after 10 minutes - please try again');
    }
    throw error;
  }
}

// Auth API
export const authApi = {
  signup: async (email: string, username: string, password: string) => {
    return fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
  },

  login: async (email: string, password: string) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  verifyToken: async () => {
    return fetchApi('/auth/verify', {
      method: 'GET',
    });
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (message: string) => {
    return fetchApi('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, stream: false }),
    });
  },
  
  sendMessageStream: async (message: string, onChunk: (chunk: string) => void, onComplete: (fullResponse: string) => void) => {
    try {
      // Add timeout for streaming requests (10 minutes for AI streaming)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, stream: true }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            console.log('[Frontend] Received chunk:', data);
            
            if (data === '[DONE]') {
              console.log(`[Frontend] Stream complete: ${fullResponse.length} chars`);
              onComplete(fullResponse);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                onChunk(parsed.content);
              }
            } catch (error) {
              // Skip invalid JSON chunks
            }
          }
        }
      }

      onComplete(fullResponse);
    } catch (error: any) {
      console.error('[Frontend] Streaming error:', error);
      if (error.name === 'AbortError') {
        onComplete('Request timeout after 10 minutes - please try again.');
      } else {
        onComplete('Sorry, there was an error with the response.');
      }
    }
  },
};

// Meal Planning API
export const mealPlanApi = {
  generatePlan: async (profile: any, budget: string, preferences: string, varietyMode: string) => {
    return fetchApi('/meal-plan/generate', {
      method: 'POST',
      body: JSON.stringify({ profile, budget, preferences, varietyMode }),
    });
  },

  generatePlanStream: async (
    profile: any, 
    budget: string, 
    preferences: string, 
    varietyMode: string,
    onProgress: (data: any) => void,
    onComplete: (mealPlan: any) => void,
    onError: (error: string) => void
  ) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/meal-plan/generate-stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ profile, budget, preferences, varietyMode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'status') {
                onProgress(parsed);
              } else if (parsed.type === 'day_complete') {
                onProgress(parsed);
              } else if (parsed.type === 'complete') {
                onComplete(parsed.mealPlan);
                return;
              } else if (parsed.type === 'error') {
                onError(parsed.message);
                return;
              }
            } catch (error) {
              // Skip invalid JSON chunks
              console.warn('Failed to parse streaming data:', data);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('[Frontend] Meal plan streaming error:', error);
      onError(error.message || 'Failed to generate meal plan');
    }
  },

  swapMeal: async (mealName: string, mealType: string, day: string, profile: any, budget: string, preferences: string) => {
    return fetchApi('/meal-plan/swap', {
      method: 'POST',
      body: JSON.stringify({ mealName, mealType, day, profile, budget, preferences }),
    });
  },

  extractPreferences: async (text: string) => {
    return fetchApi('/meal-plan/extract-preferences', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  ocrImage: async (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/meal-plan/ocr`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'OCR failed');
    }
    return data;
  },

  generateInsights: async (plan: any, profile: any) => {
    return fetchApi('/meal-plan/insights', {
      method: 'POST',
      body: JSON.stringify({ plan, profile }),
    });
  },

  generateShoppingList: async (plan: any, pantryItems: string[]) => {
    return fetchApi('/meal-plan/shopping-list', {
      method: 'POST',
      body: JSON.stringify({ plan, pantryItems }),
    });
  },
};

// Community API
export const communityApi = {
  getPosts: async (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return fetchApi(`/posts${query}`, {
      method: 'GET',
    });
  },

  createPost: async (content: string, category?: string, imageUrl?: string) => {
    return fetchApi('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, category, imageUrl }),
    });
  },

  likePost: async (postId: string) => {
    return fetchApi(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  addComment: async (postId: string, content: string) => {
    return fetchApi(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  deletePost: async (postId: string) => {
    return fetchApi(`/posts/${postId}`, {
      method: 'DELETE',
    });
  },
};
