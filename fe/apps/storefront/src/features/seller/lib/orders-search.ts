import { ORDER_FILTERS, type OrderFilter } from '../constants'

/** URL search params of /seller/orders (the dashboard "to do" cards link here with a status). */
export interface OrdersSearch {
    status?: OrderFilter
    keyword?: string
}

export const isOrderFilter = (value: unknown): value is OrderFilter =>
    typeof value === 'string' && (ORDER_FILTERS as string[]).includes(value)

export const validateOrdersSearch = (raw: Record<string, unknown>): OrdersSearch => ({
    status: isOrderFilter(raw.status) ? raw.status : undefined,
    keyword: typeof raw.keyword === 'string' && raw.keyword.trim() ? raw.keyword.trim() : undefined,
})
