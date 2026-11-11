import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { Lock, Unlock } from 'lucide-react'
import { ActionButton } from '@/components/Common/ActionButton'
import { StatusEnum } from '@/constants/options'
import type { MenuItem } from '@/types/menu.types'

import { EmailTemplateFilter } from './components/EmailTemplateFilter'
import { EmailTemplateTable } from './components/EmailTemplateTable'
import { EmailTemplateDialog } from './components/EmailTemplateDialog'
import { useEmailTemplatePage } from './hooks/useEmailTemplatePage'

interface EmailTemplatePageProps {
    menuItem?: MenuItem
}

const EmailTemplatePage = memo(({ menuItem }: EmailTemplatePageProps) => {
    const {
        t,
        title,
        finalLoading,
        loadingMessage,
        showFullSkeleton,
        filterProps,
        tableProps,
        dialogProps,
        handleActiveBulk,
        handleInactiveBulk,
        selectedRows,
    } = useEmailTemplatePage(menuItem)

    const hasSelection = selectedRows.length > 0
    const canActivate = hasSelection && selectedRows.every(row => row.status === StatusEnum.INACTIVE)
    const canInactivate = hasSelection && selectedRows.every(row => row.status === StatusEnum.ACTIVE)

    return (
        <LoadingOverlay
            isLoading={finalLoading}
            isFullScreen={finalLoading}
            text={loadingMessage}
            className="flex flex-col h-full"
        >
            <PageContainer
                title={title}
                isLoading={showFullSkeleton}
                className="flex-1 flex flex-col"
                loadingType="table-list-actions"
            >
                <FormProvider {...filterProps.methods}>
                    <EmailTemplateFilter
                        onSearch={filterProps.onSearch}
                        onReset={filterProps.onReset}
                        eventTypeOptions={filterProps.eventTypeOptions}
                    />
                </FormProvider>

                <div className="flex flex-wrap gap-2">
                    <ActionButton
                        onPress={handleActiveBulk}
                        actionCode="active-bulk"
                        isDisabled={!canActivate}
                        icon={Unlock}
                        label={t('emailTemplate.actions.activeBulk')}
                    />
                    <ActionButton
                        onPress={handleInactiveBulk}
                        actionCode="inactive-bulk"
                        isDisabled={!canInactivate}
                        icon={Lock}
                        label={t('emailTemplate.actions.inactiveBulk')}
                        variant="warning"
                    />
                </div>

                <EmailTemplateTable {...tableProps} />

                <EmailTemplateDialog {...dialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

EmailTemplatePage.displayName = 'EmailTemplatePage'
export default EmailTemplatePage
