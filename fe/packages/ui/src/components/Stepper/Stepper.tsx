import { Check } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

interface StepperStep {
    id: number
    label: string
    isDone?: boolean
    isDisabled?: boolean
}

interface StepperProps {
    steps: StepperStep[]
    activeId: number
    onSelect?: (id: number) => void
    className?: string
}

function Stepper({ steps, activeId, onSelect, className }: StepperProps) {
    return (
        <div className={cn('flex w-full items-start justify-center', className)}>
            {steps.map((step, index) => {
                const isActive = step.id === activeId
                const isClickable = !step.isDisabled && !!onSelect

                return (
                    <button
                        key={step.id}
                        type="button"
                        disabled={!isClickable}
                        aria-current={isActive ? 'step' : undefined}
                        onClick={() => onSelect?.(step.id)}
                        className={cn(
                            'relative flex flex-1 flex-col items-center gap-2 px-2 text-center outline-none',
                            isClickable ? 'cursor-pointer' : 'cursor-not-allowed',
                            step.isDisabled && 'opacity-60',
                        )}
                    >
                        {index > 0 && (
                            <span
                                aria-hidden
                                className={cn(
                                    'absolute top-4 h-0.5 transition-colors',
                                    'left-[calc(-50%+1.25rem)] right-[calc(50%+1.25rem)]',
                                    steps[index - 1]?.isDone ? 'bg-primary' : 'bg-input',
                                )}
                            />
                        )}

                        <span
                            className={cn(
                                'flex size-8 items-center justify-center rounded-full',
                                'text-sm font-semibold transition-colors',
                                isActive && 'bg-primary text-white ring-4 ring-primary/20',
                                !isActive && step.isDone && 'bg-primary/60 text-white',
                                !isActive && !step.isDone && 'bg-background text-muted-foreground ring ring-input',
                            )}
                        >
                            {step.isDone ? <Check className="size-4" /> : index + 1}
                        </span>

                        <span
                            className={cn(
                                'text-xs leading-tight transition-colors',
                                isActive ? 'font-semibold text-foreground' : 'text-muted-foreground',
                            )}
                        >
                            {step.label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

export { Stepper }
export type { StepperProps, StepperStep }
