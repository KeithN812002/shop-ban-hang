import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Modal } from '@/components/ui/modal'
import { AddressFormModal, formatAddress } from '@/features/account/components/address-form-modal'
import { useAddresses, useDeleteAddress } from '@/features/account/queries'
import { notify } from '@/lib/notify'
import type { AddressResponse } from '@/types/shop'

export const Route = createFileRoute('/account/addresses')({ component: AddressesPage })

function AddressesPage() {
    const { t } = useTranslation()
    const addresses = useAddresses()
    const remove = useDeleteAddress()
    const [editing, setEditing] = useState<AddressResponse | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [deleting, setDeleting] = useState<AddressResponse | null>(null)

    const openForm = (address: AddressResponse | null) => {
        setEditing(address)
        setFormOpen(true)
    }

    return (
        <section className="rounded-xl bg-white p-5" aria-label={t('address.title')}>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">{t('address.title')}</h1>
                <Button icon={<Plus />} onClick={() => openForm(null)}>
                    {t('address.add')}
                </Button>
            </div>

            {addresses.isLoading && <Skeleton className="h-24 w-full" />}
            {addresses.isError && <ErrorState onRetry={() => void addresses.refetch()} />}
            {addresses.data?.length === 0 && <EmptyState title={t('address.empty')} />}

            <ul className="divide-y">
                {addresses.data?.map(address => (
                    <li key={address.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                        <div className="min-w-0 text-sm">
                            <p>
                                <span className="font-semibold text-gray-900">{address.receiverName}</span>
                                <span className="text-gray-500"> | {address.phone}</span>
                                {address.isDefault && (
                                    <span className="ml-2 rounded border border-brand-300 px-1.5 py-0.5 text-xs text-brand-600">
                                        {t('address.default')}
                                    </span>
                                )}
                            </p>
                            <p className="mt-1 text-gray-600">{formatAddress(address)}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" icon={<Pencil />} onClick={() => openForm(address)}>
                                {t('common.edit')}
                            </Button>
                            <Button variant="outline" size="sm" icon={<Trash2 />} onClick={() => setDeleting(address)}>
                                {t('common.delete')}
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>

            <AddressFormModal open={formOpen} onClose={() => setFormOpen(false)} address={editing} />

            <Modal
                open={deleting !== null}
                onClose={() => setDeleting(null)}
                title={t('address.deleteTitle')}
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setDeleting(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            loading={remove.isPending}
                            onClick={() =>
                                deleting &&
                                remove.mutate(deleting.id, {
                                    onSuccess: () => {
                                        notify.success(t('address.deleted'))
                                        setDeleting(null)
                                    },
                                })
                            }
                        >
                            {t('common.delete')}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-gray-700">{t('address.deleteConfirm')}</p>
            </Modal>
        </section>
    )
}
