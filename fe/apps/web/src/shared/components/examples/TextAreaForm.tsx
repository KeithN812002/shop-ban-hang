'use client'

import { useForm } from 'react-hook-form'
import { toast } from '@workspace/ui/components/Sonner'
import { z } from '@workspace/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@workspace/ui/components/Button'
import { BsTextArea } from '@workspace/ui/components/Textfield'

const schema = z.object({
    bio: z.string().min(2),
})

type FormValues = z.infer<typeof schema>

export function TextAreaForm() {
    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { bio: '' },
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
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            <BsTextArea name="bio" control={control} label="Bio" isRequired placeholder="Type your bio here..." />
            <Button type="submit">Submit</Button>
        </form>
    )
}
