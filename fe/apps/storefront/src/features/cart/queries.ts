import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meKeys } from '@/features/account/queries'
import { useAuth } from '@/providers/auth-provider'
import type { Uuid } from '@/types/api'
import type { CartResponse } from '@/types/shop'
import { addToCart, buyNow, deleteCartItems, getCart, updateCartItem, type CartAddRequest } from './api'

export const cartKeys = {
    all: [...meKeys.all, 'cart'] as const,
}

export const useCart = () => {
    const { isAuthenticated } = useAuth()
    return useQuery({ queryKey: cartKeys.all, queryFn: getCart, enabled: isAuthenticated })
}

const useInvalidateCart = () => {
    const qc = useQueryClient()
    return () =>
        Promise.all([
            qc.invalidateQueries({ queryKey: cartKeys.all }),
            qc.invalidateQueries({ queryKey: meKeys.profile() }),
        ])
}

export const useAddToCart = () => {
    const invalidate = useInvalidateCart()
    return useMutation({ mutationFn: (req: CartAddRequest) => addToCart(req), onSuccess: invalidate })
}

export const useBuyNow = () => {
    const invalidate = useInvalidateCart()
    return useMutation({ mutationFn: (req: CartAddRequest) => buyNow(req), onSuccess: invalidate })
}

export const useUpdateCartItem = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (req: { id: Uuid; quantity?: number; selected?: boolean }) => updateCartItem(req),
        meta: { silent: false },
        // Optimistic: selection / quantity feel instant; server state is re-fetched afterwards.
        onMutate: async req => {
            await qc.cancelQueries({ queryKey: cartKeys.all })
            const previous = qc.getQueryData<CartResponse>(cartKeys.all)
            if (previous) {
                qc.setQueryData<CartResponse>(cartKeys.all, {
                    groups: previous.groups.map(group => ({
                        ...group,
                        items: group.items.map(item =>
                            item.id === req.id
                                ? {
                                      ...item,
                                      quantity: req.quantity ?? item.quantity,
                                      selected: req.selected ?? item.selected,
                                  }
                                : item,
                        ),
                    })),
                })
            }
            return { previous }
        },
        onError: (_error, _req, context) => {
            if (context?.previous) qc.setQueryData(cartKeys.all, context.previous)
        },
        onSettled: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
    })
}

/** Select / unselect several items at once (group or "select all" checkboxes). */
export const useSetCartSelection = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ ids, selected }: { ids: Uuid[]; selected: boolean }) => {
            await Promise.all(ids.map(id => updateCartItem({ id, selected })))
        },
        onSettled: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
    })
}

export const useDeleteCartItems = () => {
    const invalidate = useInvalidateCart()
    return useMutation({ mutationFn: (ids: Uuid[]) => deleteCartItems(ids), onSuccess: invalidate })
}
