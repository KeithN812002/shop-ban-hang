/**
 * Project extension point. Import this file once from `main.tsx`.
 *
 * Registers the shop administration module: its dashboard at the `/shop-admin` module root and a sidebar
 * badge with the number of store / shipper registrations waiting for approval.
 */
import { lazy, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { i18n } from '@/i18n'
import { PENDING_BADGE_QUERY_KEY, SHOP_ADMIN_FOLDERS } from '@/pages/ShopAdministration/constants'
import { fetchStatsOverview } from '@/pages/ShopAdministration/services/shopAdminService'
import { API_DATE_FORMAT } from '@/pages/ShopAdministration/utils/format'
import type { MenuTreeNode } from '@/types/menu.types'
import { normalizeMenuFolder } from '@/utils/menu.utils'
import { registerMenuBadgeProvider, type MenuBadgeMap } from './menuBadgeRegistry'
import { registerModuleDashboard } from './moduleRegistry'

const SHOP_ADMIN_ROOT_URL = '/shop-admin'
const PENDING_BADGE_CLASS = 'bg-amber-500 text-white'
const PENDING_REFETCH_MS = 60_000
const PENDING_STALE_MS = 30_000
const PENDING_RANGE_DAYS = 30

registerModuleDashboard(SHOP_ADMIN_ROOT_URL, {
    component: lazy(() => import('@/pages/ShopAdministration/Dashboard')),
    get fallbackTitle() {
        return i18n.t('shopAdmin.dashboard.title')
    },
})

const STORE_FOLDER = normalizeMenuFolder(SHOP_ADMIN_FOLDERS.store)
const SHIPPER_FOLDER = normalizeMenuFolder(SHOP_ADMIN_FOLDERS.shipper)

const collectFolders = (nodes: MenuTreeNode[], into: Set<string> = new Set()): Set<string> => {
    for (const node of nodes) {
        into.add(normalizeMenuFolder(node.PathFolder))
        collectFolders(node.children, into)
    }
    return into
}

/**
 * Pending store / shipper counts on their sidebar entries. The request only fires when the user can see
 * at least one of those menu entries, and failures stay silent (a badge is never worth an error toast).
 */
const usePendingApprovalBadges = (menuTree: MenuTreeNode[]): MenuBadgeMap => {
    const folders = useMemo(() => collectFolders(menuTree), [menuTree])
    const hasStore = folders.has(STORE_FOLDER)
    const hasShipper = folders.has(SHIPPER_FOLDER)

    const { data } = useQuery({
        queryKey: PENDING_BADGE_QUERY_KEY,
        queryFn: () =>
            fetchStatsOverview({
                fromDate: dayjs().subtract(PENDING_RANGE_DAYS, 'day').format(API_DATE_FORMAT),
                toDate: dayjs().format(API_DATE_FORMAT),
            }),
        enabled: hasStore || hasShipper,
        refetchInterval: PENDING_REFETCH_MS,
        staleTime: PENDING_STALE_MS,
        refetchOnWindowFocus: false,
        meta: { skipGlobalError: true, skipForbiddenScreen: true },
    })

    return useMemo<MenuBadgeMap>(() => {
        if (!data) return {}
        return {
            ...(hasStore && { [STORE_FOLDER]: { count: data.pendingStores, className: PENDING_BADGE_CLASS } }),
            ...(hasShipper && { [SHIPPER_FOLDER]: { count: data.pendingShippers, className: PENDING_BADGE_CLASS } }),
        }
    }, [data, hasStore, hasShipper])
}

registerMenuBadgeProvider(usePendingApprovalBadges)
