'use client'

import { useForm } from 'react-hook-form'
import { toast } from '@workspace/ui/components/Sonner'
import { z } from '@workspace/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@workspace/ui/components/Button'
import { BsInput } from '@workspace/ui/components/Textfield'

const schema = z.object({
    username: z.string().min(2),
})

type FormValues = z.infer<typeof schema>

export function InputForm() {
    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { username: '' },
    })

    function onSubmit(data: FormValues) {
        toast.neutral({
            title: 'You submitted the following values',
            description: <code>{JSON.stringify(data)}</code>,
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            <BsInput name="username" control={control} label="Username" isRequired placeholder="henry" />
            <Button type="submit">Submit</Button>
        </form>
    )
}
