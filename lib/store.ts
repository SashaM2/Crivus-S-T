import { create } from 'zustand'
import type { Profile, Quiz, Event } from './types'

interface AuthState {
  user: Profile | null
  setUser: (user: Profile | null) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  loading: true,
  setLoading: (loading) => set({ loading }),
}))

interface QuizState {
  quizzes: Quiz[]
  setQuizzes: (quizzes: Quiz[]) => void
  selectedQuiz: Quiz | null
  setSelectedQuiz: (quiz: Quiz | null) => void
}

export const useQuizStore = create<QuizState>((set) => ({
  quizzes: [],
  setQuizzes: (quizzes) => set({ quizzes }),
  selectedQuiz: null,
  setSelectedQuiz: (quiz) => set({ selectedQuiz: quiz }),
}))

