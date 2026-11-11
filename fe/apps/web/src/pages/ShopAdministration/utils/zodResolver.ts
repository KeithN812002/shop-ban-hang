import { get, set, type FieldErrors, type FieldValues, type Resolver } from 'react-hook-form'
import type { ZodType, ZodTypeDef } from 'zod'

/**
 * Minimal zod -> react-hook-form resolver. `@hookform/resolvers` is not a direct dependency of `apps/web`,
 * and the shop admin forms only need first-error-per-field reporting.
 *
 * `TIn` is the shape held by the form, `TOut` the shape the schema produces for `handleSubmit`.
 */
export const zodFormResolver =
    <TIn extends FieldValues, TOut = TIn>(schema: ZodType<TOut, ZodTypeDef, unknown>): Resolver<TIn, unknown, TOut> =>
    async values => {
        const result = schema.safeParse(values)
        if (result.success) return { values: result.data, errors: {} }

        const errors: FieldErrors<TIn> = {}
        for (const issue of result.error.issues) {
            const path = issue.path.join('.')
            if (!get(errors, path)) set(errors, path, { type: issue.code, message: issue.message })
        }
        return { values: {}, errors }
    }
