import { useState, useEffect } from 'react'

/**
 * A hook to manage the "initial load" skeleton visibility.
 * It prevents the core skeleton from flashing after the first successful data load.
 */
export const usePageSkeleton = (isLoading: boolean, hasData: boolean) => {
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

    useEffect(() => {
        if (!isLoading && hasData) {
            setHasLoadedOnce(true)
        }
    }, [isLoading, hasData])

    const showFullSkeleton = isLoading && !hasLoadedOnce

    return {
        showFullSkeleton,
        hasLoadedOnce,
    }
}
