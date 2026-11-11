import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form-controls'
import { formatNumber } from '@/lib/format'
import { toNumber } from '../lib/form-helpers'
import { variantStockSum, type ProductFormValues } from '../lib/product-schema'

/** Variant rows (name / price / stock / sku). Product stock becomes the read-only sum while rows exist. */
export function VariantsEditor() {
    const { t } = useTranslation()
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<ProductFormValues>()
    const { fields, append, remove } = useFieldArray({ control, name: 'variants' })
    const variants = useWatch({ control, name: 'variants' })

    return (
        <div className="space-y-3">
            {fields.length === 0 && <p className="text-sm text-gray-500">{t('seller.products.noVariants')}</p>}
            {fields.map((field, index) => {
                const rowErrors = errors.variants?.[index]
                return (
                    <div key={field.id} className="grid grid-cols-2 gap-2 rounded-lg border p-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                        <label className="col-span-2 space-y-1 md:col-span-1">
                            <span className="text-xs text-gray-600">{t('seller.products.variant.name')}</span>
                            <Input invalid={Boolean(rowErrors?.name)} {...register(`variants.${index}.name`)} />
                            {rowErrors?.name?.message && <span role="alert" className="block text-xs text-red-600">{rowErrors.name.message}</span>}
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs text-gray-600">{t('seller.products.variant.price')}</span>
                            <Input
                                type="number"
                                min={1}
                                step={1}
                                inputMode="numeric"
                                invalid={Boolean(rowErrors?.price)}
                                {...register(`variants.${index}.price`, { setValueAs: toNumber })}
                            />
                            {rowErrors?.price?.message && <span role="alert" className="block text-xs text-red-600">{rowErrors.price.message}</span>}
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs text-gray-600">{t('seller.products.variant.stock')}</span>
                            <Input
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                invalid={Boolean(rowErrors?.stock)}
                                {...register(`variants.${index}.stock`, { setValueAs: toNumber })}
                            />
                            {rowErrors?.stock?.message && <span role="alert" className="block text-xs text-red-600">{rowErrors.stock.message}</span>}
                        </label>
                        <label className="col-span-2 space-y-1 md:col-span-1">
                            <span className="text-xs text-gray-600">{t('seller.products.variant.sku')}</span>
                            <Input invalid={Boolean(rowErrors?.sku)} {...register(`variants.${index}.sku`)} />
                        </label>
                        <div className="col-span-2 flex items-end justify-end md:col-span-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('seller.common.remove')}
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="text-red-600" />
                            </Button>
                        </div>
                    </div>
                )
            })}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    icon={<Plus />}
                    onClick={() => append({ name: '', price: Number.NaN, stock: 0, sku: '' })}
                >
                    {t('seller.products.addVariant')}
                </Button>
                {fields.length > 0 && (
                    <p className="text-sm text-gray-600">
                        {t('seller.products.stockSum', { total: formatNumber(variantStockSum(variants ?? [])) })}
                    </p>
                )}
            </div>
        </div>
    )
}
