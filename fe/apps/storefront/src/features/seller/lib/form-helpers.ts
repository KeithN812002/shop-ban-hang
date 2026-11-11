/** `setValueAs` for required <input type="number">: empty -> NaN so zod reports a typed error. */
export const toNumber = (value: unknown): number => (value === '' || value == null ? Number.NaN : Number(value))

/** `setValueAs` for optional <input type="number">: empty -> null. */
export const toNullableNumber = (value: unknown): number | null =>
    value === '' || value == null ? null : Number(value)
