import type { MenuItem } from '@/types/menu.types'
import { getMenuDataFromPermissions } from './menu-permissions.service'

const matchesModule = (menu: MenuItem, moduleCode: string) => {
    const moduleLower = moduleCode.toLowerCase()
    return menu.AppCode?.toLowerCase() === moduleLower || menu.ModuleCode?.toLowerCase() === moduleLower
}

/** Menu entries come from the permissions returned with the authenticated user (backend menu entries). */
export async function fetchMenuData(moduleCode?: string): Promise<MenuItem[]> {
    const menus = getMenuDataFromPermissions()
    const normalizedModule = moduleCode?.trim()

    if (!normalizedModule) {
        return menus
    }

    return menus.filter(menu => matchesModule(menu, normalizedModule))
}
