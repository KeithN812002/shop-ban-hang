'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Badge } from '@workspace/ui/components/Badge'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { useTranslation } from 'react-i18next'
import { memo } from 'react'
import type { UserInfo } from '@/services/auth'
import { BsInput } from '@workspace/ui/components/Textfield'

interface UserDetailsDialogProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    user: UserInfo | null
}

export const UserDetailsDialog = memo(({ isOpen, onOpenChange, user }: UserDetailsDialogProps) => {
    const { t } = useTranslation()

    // isInternal is the account-type discriminator (external accounts are managed outside the SSO directory).
    const isInternal = user?.isInternal !== false

    const displayName = String(user?.name ?? user?.preferredUsername ?? user?.email ?? t('common.user'))
    const email = String(user?.email ?? '')
    const avatarSrc = String((user as any)?.attributes?.avatar?.[0] ?? '')

    const accountTypeName = isInternal
        ? t('dashboardLayout.userMenu.userDetailsDialog.internal')
        : t('dashboardLayout.userMenu.userDetailsDialog.external')
    const handleClose = () => onOpenChange(false)

    return (
        <FormDialogContent
            isOpen={isOpen}
            onClose={handleClose}
            title={t('dashboardLayout.userMenu.userDetailsDialog.title')}
            columns={1}
            className="max-w-md"
            t={t}
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                        <AvatarImage src={avatarSrc || undefined} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold truncate">{displayName}</span>
                            <Badge variant={isInternal ? 'default' : 'secondary'}>{accountTypeName}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{email || '-'}</div>
                    </div>
                </div>

                <BsInput
                    label={t('dashboardLayout.userMenu.userDetailsDialog.username')}
                    value={String(user?.preferredUsername ?? '')}
                    isDisabled
                />
            </div>
        </FormDialogContent>
    )
})

UserDetailsDialog.displayName = 'UserDetailsDialog'
