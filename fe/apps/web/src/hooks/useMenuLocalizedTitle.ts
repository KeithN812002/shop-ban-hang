import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { MenuItem } from '@/types/menu.types'
import { getMenuDisplayName } from '@/utils/menu.utils'
import { useActiveMenu } from '@/providers/ActiveMenuProvider'

export function useMenuLocalizedTitle(menu?: Pick<MenuItem, 'MenuName' | 'ForeignName' | 'Url'> | null) {
    const { i18n } = useTranslation()
    const activeMenu = useActiveMenu()
    const targetMenu = menu !== undefined ? menu : activeMenu

    return useMemo(() => (targetMenu ? getMenuDisplayName(targetMenu, i18n.language) : ''), [targetMenu, i18n.language])
}
