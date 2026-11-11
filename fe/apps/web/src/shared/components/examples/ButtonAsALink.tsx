import { Button } from '@workspace/ui/components/Button'
import { SquareArrowOutUpRight } from 'lucide-react'

export function ButtonAsALink() {
    return (
        <Button variant={'default'} asChild>
            <a href="/components">
                View Components
                <SquareArrowOutUpRight />
            </a>
        </Button>
    )
}
