import { useEffect, useMemo, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button, buttonClass } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/feedback'
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { formatNumber } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { ArSection } from '../components/ar-section'
import { CategorySelect } from '../components/category-select'
import { ProductImagesField } from '../components/product-images-field'
import { SellerShell } from '../components/seller-shell'
import { VariantsEditor } from '../components/variants-editor'
import { EDITABLE_PRODUCT_STATUSES } from '../constants'
import { toNullableNumber, toNumber } from '../lib/form-helpers'
import {
    buildProductSchema,
    detailToForm,
    emptyProductForm,
    formToRequest,
    variantStockSum,
    type ProductFormValues,
} from '../lib/product-schema'
import { useSaveProduct, useSellerProduct } from '../queries'


function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-3 rounded-xl border bg-white p-4">
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
            {children}
        </section>
    )
}

interface ProductFormProps {
    productId?: Uuid
    initial: ProductFormValues
    banned: boolean
    banReason?: string | null
}

function ProductForm({ productId, initial, banned, banReason }: ProductFormProps) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const save = useSaveProduct()
    const schema = useMemo(() => buildProductSchema(t), [t])
    const methods = useForm<ProductFormValues>({
        resolver: zodResolver(schema),
        defaultValues: initial,
        mode: 'onTouched',
    })
    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = methods

    const variants = watch('variants')
    const hasVariants = variants.length > 0
    const stockSum = variantStockSum(variants)

    // Product stock mirrors the variants' total so validation and the payload stay consistent.
    useEffect(() => {
        if (hasVariants) setValue('stock', stockSum, { shouldValidate: false })
    }, [hasVariants, stockSum, setValue])

    const onSubmit = handleSubmit(values => {
        save.mutate(formToRequest(values, productId), {
            onSuccess: () => {
                notify.success(t(productId ? 'seller.products.updated' : 'seller.products.created'))
                void navigate({ to: '/seller/products' })
            },
        })
    })

    return (
        <FormProvider {...methods}>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
                {banned && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <p className="font-semibold">{t('seller.products.bannedTitle')}</p>
                        <p>{t('seller.products.bannedBody', { reason: banReason || t('seller.products.noReason') })}</p>
                    </div>
                )}
                <fieldset disabled={banned || save.isPending} className="min-w-0 space-y-4">
                    <Section title={t('seller.products.form.basic')}>
                        <Field label={t('seller.products.form.category')} required error={errors.categoryId?.message}>
                            <Controller
                                control={control}
                                name="categoryId"
                                render={({ field }) => (
                                    <CategorySelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        emptyLabel={t('seller.products.form.categoryPlaceholder')}
                                        invalid={Boolean(errors.categoryId)}
                                    />
                                )}
                            />
                        </Field>
                        <Field label={t('seller.products.form.name')} required error={errors.name?.message}>
                            <Input maxLength={255} invalid={Boolean(errors.name)} {...register('name')} />
                        </Field>
                        <Field label={t('seller.products.form.description')} error={errors.description?.message}>
                            <Textarea rows={6} invalid={Boolean(errors.description)} {...register('description')} />
                        </Field>
                        <Field
                            label={t('seller.products.form.tags')}
                            hint={t('seller.products.form.tagsHint')}
                            error={errors.tags?.message}
                        >
                            <Input invalid={Boolean(errors.tags)} {...register('tags')} />
                        </Field>
                    </Section>

                    <Section title={t('seller.products.form.pricing')}>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Field label={t('seller.products.form.price')} required error={errors.price?.message}>
                                <Input
                                    type="number"
                                    min={1}
                                    step={1}
                                    inputMode="numeric"
                                    invalid={Boolean(errors.price)}
                                    {...register('price', { setValueAs: toNumber })}
                                />
                            </Field>
                            <Field
                                label={t('seller.products.form.originalPrice')}
                                hint={t('seller.products.form.originalPriceHint')}
                                error={errors.originalPrice?.message}
                            >
                                <Input
                                    type="number"
                                    min={1}
                                    step={1}
                                    inputMode="numeric"
                                    invalid={Boolean(errors.originalPrice)}
                                    {...register('originalPrice', { setValueAs: toNullableNumber })}
                                />
                            </Field>
                            <Field
                                label={t('seller.products.form.stock')}
                                hint={hasVariants ? t('seller.products.form.stockAuto', { total: formatNumber(stockSum) }) : undefined}
                                error={errors.stock?.message}
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    inputMode="numeric"
                                    readOnly={hasVariants}
                                    invalid={Boolean(errors.stock)}
                                    {...register('stock', { setValueAs: toNumber })}
                                />
                            </Field>
                        </div>
                    </Section>

                    <Section title={t('seller.products.form.images')}>
                        <ProductImagesField error={errors.images?.message ?? errors.images?.root?.message} />
                    </Section>

                    <Section title={t('seller.products.form.variants')}>
                        <VariantsEditor />
                    </Section>

                    <Section title={t('seller.products.form.arTitle')}>
                        <ArSection productId={productId} />
                    </Section>

                    <Section title={t('seller.products.form.visibility')}>
                        <Field label={t('seller.products.form.status')}>
                            <Select className="sm:w-64" {...register('status')}>
                                {EDITABLE_PRODUCT_STATUSES.map(status => (
                                    <option key={status} value={status}>
                                        {t(`seller.products.status.${status}`)}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </Section>
                </fieldset>

                <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-2 border-t bg-white/95 px-4 py-3 backdrop-blur">
                    {isDirty && !banned && <span className="mr-auto text-xs text-amber-600">{t('seller.products.form.unsaved')}</span>}
                    <Link to="/seller/products" className={buttonClass({ variant: 'outline' })}>
                        {t('seller.common.cancel')}
                    </Link>
                    <Button type="submit" icon={<Save />} loading={save.isPending} disabled={banned}>
                        {t('seller.common.save')}
                    </Button>
                </div>
            </form>
        </FormProvider>
    )
}

export function ProductFormPage({ productId }: { productId?: Uuid }) {
    const { t } = useTranslation()
    const query = useSellerProduct(productId)
    const title = t(productId ? 'seller.products.editTitle' : 'seller.products.newTitle')

    return (
        <SellerShell title={title}>
            {productId && query.isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-60 w-full rounded-xl" />
                </div>
            )}
            {productId && query.isError && <ErrorState onRetry={() => void query.refetch()} />}
            {!productId && <ProductForm initial={emptyProductForm()} banned={false} />}
            {productId && query.data && (
                <ProductForm
                    key={query.data.id}
                    productId={productId}
                    initial={detailToForm(query.data)}
                    banned={query.data.status === 'BANNED'}
                    banReason={query.data.banReason}
                />
            )}
        </SellerShell>
    )
}
