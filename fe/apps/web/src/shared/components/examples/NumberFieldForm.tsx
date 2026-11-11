'use client'

import { useForm } from 'react-hook-form'
import { toast } from '@workspace/ui/components/Sonner'
import { z } from '@workspace/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@workspace/ui/components/Button'
import { BsNumberField } from '@workspace/ui/components/Numberfield'

const schema = z.object({
    age: z.number().min(18, 'You must be at least 18 years old'),
})

type FormValues = z.infer<typeof schema>

export function NumberFieldForm() {
    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
    })

    function onSubmit(data: FormValues) {
        toast.neutral({
            title: 'You submitted the following values',
            description: (
                <pre>
                    <code>{JSON.stringify(data, null, 2)}</code>
                </pre>
            ),
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <BsNumberField name="age" control={control} label="Age" isRequired step={1} placeholder="Enter your age" />
            <Button type="submit">Submit</Button>
        </form>
    )
}
