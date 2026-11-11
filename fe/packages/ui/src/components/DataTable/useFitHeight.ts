import React from 'react'

const MIN_FIT_HEIGHT = 160

const isRowLayout = (style: CSSStyleDeclaration) =>
    (style.display.includes('flex') && !style.flexDirection.startsWith('column')) || style.display.includes('grid')

const isInFlow = (node: Element) => {
    const style = getComputedStyle(node)
    return style.display !== 'none' && style.position !== 'absolute' && style.position !== 'fixed'
}

const lastInFlowChild = (parent: Element) => {
    let node = parent.lastElementChild
    while (node && !isInFlow(node)) node = node.previousElementSibling
    return node
}

const spaceBelow = (el: HTMLElement, boundary: HTMLElement) => {
    let total = 0
    let child = el
    let parent = el.parentElement
    while (parent && parent !== boundary) {
        const last = lastInFlowChild(parent)
        if (last && last !== child && !isRowLayout(getComputedStyle(parent))) {
            total += Math.max(0, last.getBoundingClientRect().bottom - child.getBoundingClientRect().bottom)
        }
        child = parent
        parent = parent.parentElement
    }
    return total
}

const isPageScrollRegion = (scroller: HTMLElement) =>
    !scroller.closest('[role="dialog"]') && parseFloat(getComputedStyle(scroller).flexGrow) > 0

const fitInScrollRegion = (el: HTMLElement, scroller: HTMLElement) => {
    if (!isPageScrollRegion(scroller)) return null
    const rect = el.getBoundingClientRect()
    const total = spaceBelow(el, scroller)
    const tail = el.parentElement ? lastInFlowChild(el.parentElement) : null
    const own = tail && tail !== el ? Math.max(0, tail.getBoundingClientRect().bottom - rect.bottom) : 0
    if (total - own > 1) return null
    const topInContent = rect.top - scroller.getBoundingClientRect().top - scroller.clientTop + scroller.scrollTop
    const bottom = scroller.clientHeight - parseFloat(getComputedStyle(scroller).paddingBottom)
    const available = bottom - topInContent - total
    return available < MIN_FIT_HEIGHT ? null : available
}

const fitInPage = (el: HTMLElement, boundary: HTMLElement) => {
    const bottom = boundary.getBoundingClientRect().bottom - parseFloat(getComputedStyle(boundary).paddingBottom)
    return Math.max(MIN_FIT_HEIGHT, bottom - el.getBoundingClientRect().top - spaceBelow(el, boundary))
}

const measureFit = (el: HTMLElement, fitPage: boolean) => {
    let boundary: HTMLElement | null = el.parentElement
    while (boundary && boundary !== document.body) {
        const overflowY = getComputedStyle(boundary).overflowY
        if (overflowY === 'auto' || overflowY === 'scroll') return fitInScrollRegion(el, boundary)
        if (overflowY === 'hidden' || overflowY === 'clip') return fitPage ? fitInPage(el, boundary) : null
        boundary = boundary.parentElement
    }
    return null
}

export function useFitHeight(ref: React.RefObject<HTMLElement | null>, fitPage: boolean) {
    const [fitHeight, setFitHeight] = React.useState<number | null>(null)

    React.useLayoutEffect(() => {
        let frame = 0

        const measure = () => {
            const el = ref.current
            if (!el || el.getClientRects().length === 0) return
            const fit = measureFit(el, fitPage)
            const next = fit === null ? null : Math.floor(fit * 10) / 10
            setFitHeight(prev =>
                prev === next || (prev !== null && next !== null && Math.abs(prev - next) < 0.5) ? prev : next,
            )
        }

        const schedule = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(measure)
        }

        measure()
        window.addEventListener('resize', schedule)
        const mutationObserver = new MutationObserver(schedule)
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden'],
        })
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('resize', schedule)
            mutationObserver.disconnect()
        }
    }, [ref, fitPage])

    return fitHeight
}
