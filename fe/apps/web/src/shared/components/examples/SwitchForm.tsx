'use client'

import { useForm } from 'react-hook-form'
import { toast } from '@workspace/ui/components/Sonner'

import { Button } from '@workspace/ui/components/Button'
import { BsSwitch } from '@workspace/ui/components/Switch'
import { Separator } from '@workspace/ui/components/Separator'

interface FormValues {
    airplaneMode: boolean
    wifi: boolean
    bluetooth: boolean
}

export function SwitchForm() {
    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            airplaneMode: false,
            wifi: true,
            bluetooth: false,
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
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            <BsSwitch name="airplaneMode" control={control} label="Airplane mode" />
            <Separator />
            <BsSwitch name="wifi" control={control} label="Wi-Fi" />
            <Separator />
            <BsSwitch name="bluetooth" control={control} label="Bluetooth" />
            <Separator />
            <Button type="submit">Submit</Button>
        </form>
    )
}
