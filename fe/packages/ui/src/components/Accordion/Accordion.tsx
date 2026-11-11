'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
    return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
    return (
        <AccordionPrimitive.Item
            data-slot="accordion-item"
            className={cn('group/accordion-item border-b last:border-b-0', className)}
            {...props}
        />
    )
}

function AccordionTrigger({
    className,
    children,
    icon,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
    icon?: React.ReactNode
}) {
    const iconNode = (
        <div
            className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/50 transition-transform duration-200',
                !icon && 'group-data-[state=open]/accordion-trigger:rotate-180',
            )}
        >
            {icon ?? <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4" />}
        </div>
    )

    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                className={cn(
                    'group/accordion-trigger focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
                    className,
                )}
                {...props}
            >
                {children}
                {iconNode}
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    )
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
    return (
        <AccordionPrimitive.Content
            data-slot="accordion-content"
            forceMount={true}
            className="data-[state=closed]:block data-[state=closed]:h-0 data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none data-[state=closed]:overflow-hidden data-[state=open]:block data-[state=open]:h-auto data-[state=open]:opacity-100 overflow-hidden text-sm transition-all duration-300"
            {...props}
        >
            <div className={cn('pt-0 pb-4', className)}>{children}</div>
        </AccordionPrimitive.Content>
    )
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
