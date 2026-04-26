/**
 * Q-103 (CRM-V3-PRODUCTION-AUDIT-2026-04-25.md): typed wrapper around
 * `@hookform/resolvers/zod`'s `zodResolver` so we can stop sprinkling
 * `as any` casts every time a schema uses `z.coerce.number()`,
 * `z.string().default(...)`, or `.transform(...)`.
 *
 * Why the cast was needed in the first place
 * -------------------------------------------
 * `@hookform/resolvers@^5` returns a `Resolver<TFieldValues>` whose generic
 * is narrowed to `z.output<typeof schema>` by default. But when a schema
 * has *coercions* or *defaults*, `z.input<typeof schema>` !== `z.output<...>`
 * — the form values you bind to inputs (input type) are looser than the
 * parsed output the API consumes. `useForm<FormInput>` with a resolver
 * inferred as `Resolver<FormOutput>` then errors at the call site.
 *
 * Usage
 * -----
 *   const schema = z.object({ amount: z.coerce.number().positive() })
 *   type FormInput  = z.input<typeof schema>     // { amount: unknown }
 *   type FormOutput = z.output<typeof schema>    // { amount: number  }
 *
 *   const { register, handleSubmit } = useForm<FormInput>({
 *     resolver: zodFormResolver(schema),         // no cast needed
 *   })
 *
 *   const onSubmit = (data: FormOutput) => mutate(data)
 *
 * The cast is contained here once instead of at every form site, so we
 * still have type safety for `register`, `formState.errors`, etc.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver, FieldValues } from 'react-hook-form'
import type { ZodType } from 'zod'

/**
 * Strongly-typed `Resolver` for a Zod schema. Bind your form to the
 * schema's *input* type; the resolver still validates against the schema
 * and surfaces field errors normally.
 */
export function zodFormResolver<TInput extends FieldValues>(
  // We type the schema loosely on purpose — the underlying zodResolver
  // accepts any ZodType and deals with the Standard Schema bridge.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<any, any, any>,
): Resolver<TInput> {
  // The single, intentional cast — see file header for rationale.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return zodResolver(schema) as unknown as Resolver<TInput>
}
