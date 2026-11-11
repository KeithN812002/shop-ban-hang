import { cn } from '@workspace/ui/lib/utils'

function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            role="status"
            aria-label="Loading"
            className={cn(
                'inline-block animate-spin rounded-full border-[3px] border-primary border-t-transparent',
                className,
            )}
            {...props}
        />
    )
}

export { Spinner }
