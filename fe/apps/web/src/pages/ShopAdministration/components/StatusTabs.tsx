import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParseKeys } from 'i18next'
import { Tab, TabList, Tabs } from '@workspace/ui/components/Tabs'

export const ALL_TAB = 'ALL'

export interface StatusTabOption {
    value: string
    label: ParseKeys
}

interface StatusTabsProps {
    tabs: StatusTabOption[]
    /** Selected status, or `undefined` for the "all" tab. */
    value?: string
    onChange: (value: string | undefined) => void
    ariaLabel: string
}

/** Tab strip that drives a status filter; the grid below is the single shared panel. */
export const StatusTabs = memo(({ tabs, value, onChange, ariaLabel }: StatusTabsProps) => {
    const { t } = useTranslation()
    return (
        <Tabs
            selectedKey={value ?? ALL_TAB}
            onSelectionChange={key => onChange(key === ALL_TAB ? undefined : String(key))}
        >
            <TabList aria-label={ariaLabel}>
                <Tab id={ALL_TAB}>{t('common.all')}</Tab>
                {tabs.map(tab => (
                    <Tab key={tab.value} id={tab.value}>
                        {t(tab.label)}
                    </Tab>
                ))}
            </TabList>
        </Tabs>
    )
})

StatusTabs.displayName = 'StatusTabs'
