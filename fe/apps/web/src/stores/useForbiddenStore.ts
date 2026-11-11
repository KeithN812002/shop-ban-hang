import { create } from 'zustand'

interface ForbiddenState {
    active: boolean
    message?: string
    traceId?: string
    trigger: (payload: { message?: string; traceId?: string }) => void
    clear: () => void
}

export const useForbiddenStore = create<ForbiddenState>((set, get) => ({
    active: false,
    message: undefined,
    traceId: undefined,
    trigger: payload => {
        if (get().active) return
        set({ active: true, message: payload.message, traceId: payload.traceId })
    },
    clear: () => {
        if (!get().active) return
        set({ active: false, message: undefined, traceId: undefined })
    },
}))
