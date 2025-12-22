import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  completedDates: string[];
  streak: number;
  xpReward: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  tasks: Task[];
  deadline?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface Friend {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline';
  level: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  level: number;
  xp: number;
  hearts: number;
  maxHearts: number;
  totalHabitsCompleted: number;
  longestStreak: number;
}

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  friends: Friend[];
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
  addHabit: (habit: Omit<Habit, 'id' | 'completedDates' | 'streak' | 'createdAt'>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'progress' | 'createdAt'>) => void;
  deleteGoal: (id: string) => void;
  toggleTask: (goalId: string, taskId: string) => void;
  addXp: (amount: number) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  getTodayString: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUser: UserProfile = {
  id: '1',
  username: 'StarExplorer',
  email: 'explorer@starpath.io',
  avatar: '',
  bio: 'On my journey to build better habits ✨',
  level: 5,
  xp: 2450,
  hearts: 4,
  maxHearts: 5,
  totalHabitsCompleted: 127,
  longestStreak: 21,
};

const defaultHabits: Habit[] = [
  {
    id: '1',
    name: 'Morning Meditation',
    description: '10 minutes of mindfulness',
    icon: '🧘',
    color: 'primary',
    frequency: 'daily',
    completedDates: [],
    streak: 7,
    xpReward: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Read for 30 min',
    description: 'Read educational content',
    icon: '📚',
    color: 'accent',
    frequency: 'daily',
    completedDates: [],
    streak: 12,
    xpReward: 75,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Exercise',
    description: 'At least 30 minutes of physical activity',
    icon: '💪',
    color: 'xp',
    frequency: 'daily',
    completedDates: [],
    streak: 5,
    xpReward: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Study Programming',
    description: 'Practice coding skills',
    icon: '💻',
    color: 'streak',
    frequency: 'daily',
    completedDates: [],
    streak: 15,
    xpReward: 100,
    createdAt: new Date().toISOString(),
  },
];

const defaultGoals: Goal[] = [
  {
    id: '1',
    title: 'Complete React Course',
    description: 'Finish the advanced React patterns course',
    progress: 65,
    tasks: [
      { id: 't1', title: 'Hooks deep dive', completed: true },
      { id: 't2', title: 'Context patterns', completed: true },
      { id: 't3', title: 'Performance optimization', completed: false },
      { id: 't4', title: 'Testing strategies', completed: false },
    ],
    deadline: '2025-01-15',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Build Portfolio',
    description: 'Create a professional portfolio website',
    progress: 40,
    tasks: [
      { id: 't5', title: 'Design mockups', completed: true },
      { id: 't6', title: 'Build homepage', completed: true },
      { id: 't7', title: 'Add projects section', completed: false },
      { id: 't8', title: 'Deploy to production', completed: false },
    ],
    deadline: '2025-02-01',
    createdAt: new Date().toISOString(),
  },
];

const defaultFriends: Friend[] = [
  { id: '1', username: 'CosmicCoder', avatar: '', status: 'online', level: 8 },
  { id: '2', username: 'StarSeeker', avatar: '', status: 'online', level: 6 },
  { id: '3', username: 'NebulaNinja', avatar: '', status: 'offline', level: 12 },
  { id: '4', username: 'GalaxyGuru', avatar: '', status: 'offline', level: 9 },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(defaultUser);
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [friends, setFriends] = useState<Friend[]>(defaultFriends);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const addHabit = (habitData: Omit<Habit, 'id' | 'completedDates' | 'streak' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      completedDates: [],
      streak: 0,
      createdAt: new Date().toISOString(),
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const toggleHabitCompletion = (id: string) => {
    const today = getTodayString();
    setHabits(prev => prev.map(habit => {
      if (habit.id !== id) return habit;
      
      const isCompleted = habit.completedDates.includes(today);
      let newCompletedDates: string[];
      let newStreak: number;
      let xpChange = 0;

      if (isCompleted) {
        newCompletedDates = habit.completedDates.filter(d => d !== today);
        newStreak = Math.max(0, habit.streak - 1);
        xpChange = -habit.xpReward;
      } else {
        newCompletedDates = [...habit.completedDates, today];
        newStreak = habit.streak + 1;
        xpChange = habit.xpReward;
      }

      if (xpChange !== 0 && user) {
        addXp(xpChange);
      }

      return {
        ...habit,
        completedDates: newCompletedDates,
        streak: newStreak,
      };
    }));
  };

  const addGoal = (goalData: Omit<Goal, 'id' | 'progress' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const toggleTask = (goalId: string, taskId: string) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id !== goalId) return goal;
      
      const updatedTasks = goal.tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      
      const completedCount = updatedTasks.filter(t => t.completed).length;
      const progress = Math.round((completedCount / updatedTasks.length) * 100);
      
      return { ...goal, tasks: updatedTasks, progress };
    }));
  };

  const addXp = (amount: number) => {
    if (!user) return;
    
    const xpPerLevel = 500;
    let newXp = user.xp + amount;
    let newLevel = user.level;
    
    while (newXp >= xpPerLevel) {
      newXp -= xpPerLevel;
      newLevel++;
    }
    
    while (newXp < 0 && newLevel > 1) {
      newXp += xpPerLevel;
      newLevel--;
    }
    
    newXp = Math.max(0, newXp);
    
    setUser({ ...user, xp: newXp, level: newLevel });
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      habits,
      setHabits,
      goals,
      setGoals,
      friends,
      setFriends,
      addHabit,
      deleteHabit,
      toggleHabitCompletion,
      addGoal,
      deleteGoal,
      toggleTask,
      addXp,
      theme,
      toggleTheme,
      getTodayString,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
