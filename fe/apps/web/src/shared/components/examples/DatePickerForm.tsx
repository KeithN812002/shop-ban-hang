'use client'

import { useForm } from 'react-hook-form'
import { toast } from '@workspace/ui/components/Sonner'

import { Button } from '@workspace/ui/components/Button'
import { BsDatePicker } from '@workspace/ui/components/DatePicker'

interface FormValues {
    startDate: string
}

export function DatePickerForm() {
    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: { startDate: '' },
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
            <BsDatePicker name="startDate" control={control} label="Start Date" isRequired />
            <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline">
                    Cancel
                </Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    )
}
