'use client'

import { toast } from '@workspace/ui/components/Sonner'
import { useForm } from 'react-hook-form'
import { Button } from '@workspace/ui/components/Button'
import { BsCheckboxGroup } from '@workspace/ui/components/Checkbox'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import { BsTextArea } from '@workspace/ui/components/Textfield'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/Form'

interface FormValues {
    interest: Array<string>
    bio: string
    acceptTerm: boolean
}

export function CheckboxForm() {
    const form = useForm<FormValues>({
        defaultValues: {
            interest: [],
            bio: '',
            acceptTerm: false,
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <BsCheckboxGroup
                    name="interest"
                    control={form.control}
                    label="Select your interests"
                    options={[
                        { id: 'reading', name: 'Reading' },
                        { id: 'writing', name: 'Writing' },
                        { id: 'coding', name: 'Coding' },
                    ]}
                />
                <BsTextArea name="bio" control={form.control} label="Bio" placeholder="Type your bio here..." />
                {/* acceptTerm uses standalone Checkbox — custom logic, keeping FormField */}
                <FormField
                    control={form.control}
                    name="acceptTerm"
                    rules={{
                        validate: value => value || 'Please accept the terms and conditions',
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Checkbox isSelected={field.value} onChange={field.onChange}>
                                    I accept the terms and conditions
                                </Checkbox>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
}
