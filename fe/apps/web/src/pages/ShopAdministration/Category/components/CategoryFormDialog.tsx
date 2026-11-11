import { memo, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsNumberField } from '@workspace/ui/components/Numberfield'
import { ActionButton } from '@/components/Common/ActionButton'
import { useDialogTitle } from '@/hooks'
import { ACTIVE_STATUS_OPTIONS, ACTIVE_STATUSES } from '../../constants'
import { collectDescendantIds } from '../../utils/category'
import { resolveMediaUrl, slugify } from '../../utils/format'
import { zodFormResolver } from '../../utils/zodResolver'
import type { CategoryRequest, CategoryRow } from '../../types'

const NAME_MAX_LENGTH = 100
const SLUG_MAX_LENGTH = 120
const ICON_MAX_LENGTH = 100
const IMAGE_URL_MAX_LENGTH = 500
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

interface CategoryFormValues {
    name: string
    slug: string
    icon: string
    imageUrl: string
    parentId: string | null
    sortOrder: number | null
    status: string
}

const DEFAULT_VALUES: CategoryFormValues = {
    name: '',
    slug: '',
    icon: '',
    imageUrl: '',
    parentId: null,
    sortOrder: 0,
    status: 'ACTIVE',
}

const buildSchema = (t: TFunction) => {
    const required = (label: string) => t('forms.validation.required', { label })
    const maxLength = (label: string, max: number) => t('forms.validation.maxLength', { label, max })
    const label = {
        name: t('shopAdmin.category.fields.name'),
        slug: t('shopAdmin.category.fields.slug'),
        icon: t('shopAdmin.category.fields.icon'),
        imageUrl: t('shopAdmin.category.fields.imageUrl'),
        sortOrder: t('shopAdmin.category.fields.sortOrder'),
    }
    return z.object({
        name: z
            .string()
            .trim()
            .min(1, required(label.name))
            .max(NAME_MAX_LENGTH, maxLength(label.name, NAME_MAX_LENGTH)),
        slug: z
            .string()
            .trim()
            .min(1, required(label.slug))
            .max(SLUG_MAX_LENGTH, maxLength(label.slug, SLUG_MAX_LENGTH))
            .regex(SLUG_PATTERN, t('shopAdmin.category.errors.slugFormat')),
        icon: z.string().trim().max(ICON_MAX_LENGTH, maxLength(label.icon, ICON_MAX_LENGTH)),
        imageUrl: z.string().trim().max(IMAGE_URL_MAX_LENGTH, maxLength(label.imageUrl, IMAGE_URL_MAX_LENGTH)),
        parentId: z.string().nullable(),
        sortOrder: z
            .number({ required_error: required(label.sortOrder), invalid_type_error: required(label.sortOrder) })
            .int(t('forms.validation.integer', { label: label.sortOrder }))
            .min(0, t('forms.validation.min', { label: label.sortOrder, min: 0 })),
        status: z.enum(ACTIVE_STATUSES),
    })
}

type CategoryFormOutput = z.output<ReturnType<typeof buildSchema>>

interface CategoryFormDialogProps {
    isOpen: boolean
    category?: CategoryRow
    allCategories: CategoryRow[]
    isPending?: boolean
    onClose: () => void
    onSubmit: (data: CategoryRequest) => Promise<void>
}

export const CategoryFormDialog = memo(
    ({ isOpen, category, allCategories, isPending, onClose, onSubmit }: CategoryFormDialogProps) => {
        const { t } = useTranslation()
        const dialogTitle = useDialogTitle()
        const schema = useMemo(() => buildSchema(t), [t])
        const methods = useForm<CategoryFormValues, unknown, CategoryFormOutput>({
            defaultValues: DEFAULT_VALUES,
            resolver: zodFormResolver<CategoryFormValues, CategoryFormOutput>(schema),
        })
        const { handleSubmit, reset, watch, setValue, formState } = methods
        const isEdit = !!category
        const name = watch('name')
        const imageUrl = watch('imageUrl')

        useEffect(() => {
            if (!isOpen) return
            reset(
                category
                    ? {
                          name: category.name,
                          slug: category.slug,
                          icon: category.icon ?? '',
                          imageUrl: category.imageUrl ?? '',
                          parentId: category.parentId ?? null,
                          sortOrder: category.sortOrder,
                          status: category.status,
                      }
                    : DEFAULT_VALUES,
            )
        }, [isOpen, category, reset])

        // While creating, keep the slug in step with the name until the user edits the slug by hand.
        const isSlugEdited = !!formState.dirtyFields.slug
        useEffect(() => {
            if (!isOpen || isEdit || isSlugEdited) return
            setValue('slug', slugify(name))
        }, [isOpen, isEdit, isSlugEdited, name, setValue])

        const parentOptions = useMemo(() => {
            const excluded = category ? collectDescendantIds(allCategories, category.id) : new Set<string>()
            return allCategories.filter(row => !excluded.has(row.id)).map(row => ({ id: row.id, name: row.path }))
        }, [allCategories, category])

        const submit = handleSubmit(async values => {
            await onSubmit({
                id: category?.id,
                name: values.name,
                slug: values.slug,
                icon: values.icon || null,
                imageUrl: values.imageUrl || null,
                parentId: values.parentId,
                sortOrder: values.sortOrder,
                status: values.status,
            })
        })

        const previewUrl = resolveMediaUrl(imageUrl)

        return (
            <FormDialogContent
                isOpen={isOpen}
                onClose={onClose}
                onSave={submit}
                isPending={isPending}
                title={dialogTitle(isEdit ? 'edit' : 'create')}
                t={t}
                columns={2}
                className="max-w-3xl"
                footer={
                    <ActionButton
                        type="submit"
                        actionType={isEdit ? 'update' : 'create'}
                        actionCode={isEdit ? 'update' : 'create'}
                        isDisabled={isPending}
                    />
                }
            >
                <FormProvider {...methods}>
                    <BsInput
                        label={t('shopAdmin.category.fields.name')}
                        name="name"
                        isRequired
                        maxLength={NAME_MAX_LENGTH}
                        autoFocus
                    />
                    <BsInput
                        label={t('shopAdmin.category.fields.slug')}
                        name="slug"
                        isRequired
                        maxLength={SLUG_MAX_LENGTH}
                    />
                    <BsSelect
                        label={t('shopAdmin.category.fields.parent')}
                        name="parentId"
                        options={parentOptions}
                        valueKey="id"
                        labelKey="name"
                        skipTranslation
                        isSearchable
                        isClearable
                    />
                    <BsNumberField
                        label={t('shopAdmin.category.fields.sortOrder')}
                        name="sortOrder"
                        isRequired
                        minValue={0}
                    />
                    <BsInput label={t('shopAdmin.category.fields.icon')} name="icon" maxLength={ICON_MAX_LENGTH} />
                    <BsSelect
                        label={t('common.status')}
                        name="status"
                        options={ACTIVE_STATUS_OPTIONS}
                        valueKey="value"
                        labelKey="label"
                        isRequired
                    />
                    <BsInput
                        label={t('shopAdmin.category.fields.imageUrl')}
                        name="imageUrl"
                        maxLength={IMAGE_URL_MAX_LENGTH}
                        containerClassName="col-span-2"
                    />
                    {previewUrl && (
                        <img
                            src={previewUrl}
                            alt={t('shopAdmin.category.fields.imagePreview')}
                            className="col-span-2 h-28 w-28 rounded-md border object-cover"
                        />
                    )}
                </FormProvider>
            </FormDialogContent>
        )
    },
)

CategoryFormDialog.displayName = 'CategoryFormDialog'
