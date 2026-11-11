'use client'

import { useForm } from 'react-hook-form'
import { toast } from '@workspace/ui/components/Sonner'
import { z } from '@workspace/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@workspace/ui/components/Button'
import { BsSelect } from '@workspace/ui/components/Select'

const languageOptions = [
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Spanish' },
    { id: 'fr', name: 'French' },
    { id: 'de', name: 'German' },
    { id: 'it', name: 'Italian' },
]

const roleOptions = [
    { id: 'admin', name: 'Admin' },
    { id: 'user', name: 'User' },
]

const schema = z.object({
    role: z.string().min(1),
    languages: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

export function SelectForm() {
    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            role: roleOptions[0].id,
        },
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 w-full">
            <BsSelect name="role" control={control} label="Role" isRequired isClearable options={roleOptions} />
            <BsSelect
                name="languages"
                control={control}
                label="Language"
                selectionMode="multiple"
                options={languageOptions}
            />
            <div className="grid grid-cols-2 gap-2 py-2">
                <Button variant="outline">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    )
}
