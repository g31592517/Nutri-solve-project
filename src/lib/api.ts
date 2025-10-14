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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
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
      body: JSON.stringify({ message }),
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
