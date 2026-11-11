import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getErrorMessage } from '@/lib/http'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { useAcceptOrder } from '../queries'
import type { ShipperOrderRow } from '../types'
import { isReturnJob } from './order-utils'

/**
 * Accept-order action shared by the available list and the detail page. A lost race ("already taken")
 * is surfaced as a normal toast; the mutation settles by refreshing every order list. On success the shipper
 * lands on the order detail, where the next step (picked up -> deliver) is.
 */
export function useAcceptAction() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const accept = useAcceptOrder()

    const run = (order: { id: Uuid } & Pick<ShipperOrderRow, 'jobType' | 'status'>, onAccepted?: () => void) => {
        const { id } = order
        accept.mutate(id, {
            onSuccess: () => {
                // A return job is picked up at the buyer, not at the store.
                notify.success(t(isReturnJob(order) ? 'shipper.available.returnAccepted' : 'shipper.available.accepted'))
                onAccepted?.()
                void navigate({ to: '/shipper/orders/$id', params: { id } })
            },
            onError: error => notify.error(getErrorMessage(error, t('shipper.available.alreadyTaken'))),
        })
    }

    return { run, isPending: accept.isPending, pendingId: accept.isPending ? accept.variables : undefined }
}
