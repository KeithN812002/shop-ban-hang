'use client'

import { toast } from '@workspace/ui/components/Sonner'
import { useForm } from 'react-hook-form'
import { z } from '@workspace/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@workspace/ui/components/Button'
import { BsRadioGroup } from '@workspace/ui/components/RadioGroup'
import { Separator } from '@workspace/ui/components/Separator'

const schema = z.object({
    shippingMethod: z.string().min(1),
    paymentMethod: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export function RadioGroupForm() {
    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { shippingMethod: '', paymentMethod: '' },
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
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
            <BsRadioGroup
                name="shippingMethod"
                control={control}
                label="Shipping Method"
                isRequired
                options={[
                    { id: 'standard', name: 'Standard Shipping (3-5 days)' },
                    { id: 'express', name: 'Express Shipping (1-2 days)' },
                    { id: 'overnight', name: 'Overnight Shipping' },
                ]}
            />
            <BsRadioGroup
                name="paymentMethod"
                control={control}
                label="Payment Method"
                isRequired
                options={[
                    { id: 'credit', name: 'Credit Card' },
                    { id: 'debit', name: 'Debit Card' },
                    { id: 'paypal', name: 'PayPal' },
                ]}
            />
            <Separator />
            <Button type="submit">Submit</Button>
        </form>
    )
}
