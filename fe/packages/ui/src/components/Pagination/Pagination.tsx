'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'
import ReactPaginate from 'react-paginate'
import { cn } from '@workspace/ui/lib/utils'
import { BsSelect } from '@workspace/ui/components/Select'
import { useIsMobile } from '@workspace/ui/hooks/use-mobile'
import type { PaginationProps, PaginationPageSizeSelectorProps } from './Pagination.types'

const baseClass =
    'cursor-pointer select-none text-[13px] font-medium flex w-8 h-8 items-center justify-center rounded-sm hover:bg-background-secondary'

function Pagination({ value: controlledValue, onChange: controlledOnChange, pageCount, isDisabled }: PaginationProps) {
    const [uncontrolledValue, setUncontrolledValue] = React.useState<number | undefined>(controlledValue)

    const value = controlledValue ?? uncontrolledValue
    const onChange = controlledOnChange ?? setUncontrolledValue

    const isMobile = useIsMobile()

    return (
        <div className={cn(isDisabled && 'pointer-events-none opacity-50')}>
            <ReactPaginate
                forcePage={(value || 1) - 1}
                onPageChange={data => onChange?.(data.selected + 1)}
                pageCount={pageCount}
                previousLabel={<ChevronLeft className="w-4 h-4" />}
                nextLabel={<ChevronRight className="w-4 h-4" />}
                pageRangeDisplayed={isMobile ? 0 : 2}
                marginPagesDisplayed={isMobile ? 0 : 1}
                containerClassName="flex items-center justify-center gap-1"
                pageLinkClassName={baseClass}
                activeLinkClassName={cn(baseClass, 'bg-background-secondary shadow-sm border  text-foreground')}
                previousLinkClassName={baseClass}
                nextLinkClassName={baseClass}
                breakLinkClassName={baseClass}
                disabledLinkClassName="opacity-50 cursor-not-allowed! hover:bg-transparent!"
                breakLabel="..."
                breakClassName="block"
            />
        </div>
    )
}

function PaginationPageSizeSelector({
    value: controlledValue,
    onChange: controlledOnChange,
    defaultValue,
    options = [5, 10, 20, 50, 100],
    label = 'Items per page',
    isDisabled,
}: PaginationPageSizeSelectorProps) {
    const [uncontrolledValue, setUncontrolledValue] = React.useState<number | undefined>(defaultValue || options[0])

    const value = controlledValue ?? uncontrolledValue
    const onChange = controlledOnChange ?? setUncontrolledValue

    return (
        <div className="flex items-center gap-2">
            <BsSelect
                selectedValue={value}
                onChange={value => onChange?.(Number(value || 0))}
                options={options.map(option => ({
                    id: option,
                    name: option.toString(),
                }))}
                placeholder=""
                isClearable={false}
                className="min-w-[66px]"
                popoverClassName="w-[90px]"
                isDisabled={isDisabled}
            />
            {label ? <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span> : null}
        </div>
    )
}

export { Pagination, PaginationPageSizeSelector }
