import React from 'react'

import { Focusable } from 'react-aria'
import { Tooltip, TooltipTrigger } from '../Tooltip'

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title: React.ReactNode
    // Must sit on the truncating element itself: CSS paints the ellipsis with that element's
    // colour, so colouring an inner span leaves a mismatched "…" behind.
    titleStyle?: React.CSSProperties
    description?: string
    meta?: React.ReactNode
    children?: React.ReactNode
}

const PageHeader = ({ className, title, titleStyle, description, meta, children, ...props }: PageHeaderProps) => {
    const titleRef = React.useRef<HTMLDivElement>(null)
    const [isTruncated, setIsTruncated] = React.useState(false)

    React.useEffect(() => {
        const element = titleRef.current
        if (!element) return

        const checkTruncation = () => {
            setIsTruncated(element.scrollWidth > element.clientWidth)
        }

        const resizeObserver = new ResizeObserver(() => {
            checkTruncation()
        })

        resizeObserver.observe(element)
        checkTruncation()

        return () => {
            resizeObserver.disconnect()
        }
    }, [title])

    const titleContent = (
        <div ref={titleRef} style={titleStyle} className="text-2xl font-bold tracking-tight truncate">
            {title}
        </div>
    )

    return (
        <div className={className} {...props}>
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                    {typeof title === 'string' ? (
                        <TooltipTrigger delay={300} isDisabled={!isTruncated}>
                            <Focusable>{titleContent}</Focusable>
                            <Tooltip>{title}</Tooltip>
                        </TooltipTrigger>
                    ) : (
                        titleContent
                    )}
                    {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
                </div>
                {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
            </div>
            {meta && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">{meta}</div>}
        </div>
    )
}

export { PageHeader }
