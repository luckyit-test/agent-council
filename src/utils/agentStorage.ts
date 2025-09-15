// Utility functions for managing user agents in localStorage

export interface UserAgent {
  id: string;
  name: string;
  type: string;
  description: string;
  prompt?: string;
  author?: string;
  tags?: string[];
  category?: string;
  isCustom: boolean;
  addedAt: string;
  rating?: number;
  usageCount?: number;
  aiProvider?: string; // openai, anthropic, google, etc.
  aiModel?: string; // specific model like gpt-4, claude-3-sonnet, etc.
  capabilities?: {
    webSearch?: boolean;
    deepResearch?: boolean;
  };
}

const USER_AGENTS_KEY = 'userAgents';

export const getUserAgents = (): UserAgent[] => {
  try {
    const stored = localStorage.getItem(USER_AGENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading user agents:', error);
    return [];
  }
};

export const addUserAgent = (agent: Omit<UserAgent, 'isCustom' | 'addedAt'>): boolean => {
  try {
    const userAgents = getUserAgents();
    
    // Check if agent already exists
    if (userAgents.some(a => a.id === agent.id)) {
      return false; // Already exists
    }
    
    const newAgent: UserAgent = {
      ...agent,
      isCustom: false, // Added from marketplace
      addedAt: new Date().toISOString()
    };
    
    userAgents.push(newAgent);
    localStorage.setItem(USER_AGENTS_KEY, JSON.stringify(userAgents));
    return true;
  } catch (error) {
    console.error('Error adding user agent:', error);
    return false;
  }
};

export const removeUserAgent = (agentId: string): boolean => {
  try {
    const userAgents = getUserAgents();
    const filtered = userAgents.filter(a => a.id !== agentId);
    localStorage.setItem(USER_AGENTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing user agent:', error);
    return false;
  }
};

export const isAgentAdded = (agentId: string): boolean => {
  const userAgents = getUserAgents();
  return userAgents.some(a => a.id === agentId);
};

export const createCustomAgent = (agent: Omit<UserAgent, 'id' | 'isCustom' | 'addedAt'>): boolean => {
  try {
    const userAgents = getUserAgents();
    
    const newAgent: UserAgent = {
      ...agent,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isCustom: true,
      addedAt: new Date().toISOString()
    };
    
    userAgents.push(newAgent);
    localStorage.setItem(USER_AGENTS_KEY, JSON.stringify(userAgents));
    return true;
  } catch (error) {
    console.error('Error creating custom agent:', error);
    return false;
  }
};

export const updateUserAgent = (agentId: string, updates: Partial<UserAgent>): boolean => {
  try {
    const userAgents = getUserAgents();
    const agentIndex = userAgents.findIndex(a => a.id === agentId);
    
    if (agentIndex === -1) return false;
    
    userAgents[agentIndex] = { ...userAgents[agentIndex], ...updates };
    localStorage.setItem(USER_AGENTS_KEY, JSON.stringify(userAgents));
    return true;
  } catch (error) {
    console.error('Error updating user agent:', error);
    return false;
  }
};