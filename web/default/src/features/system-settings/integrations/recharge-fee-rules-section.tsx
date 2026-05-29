import * as React from 'react'
import * as z from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

const feeRuleSchema = z.object({
  min_amount: z.coerce.number().min(0, 'Min amount must be >= 0'),
  max_amount: z.coerce.number(), // -1 means unlimited
  fee_rate: z.coerce
    .number()
    .min(0, 'Fee rate must be >= 0')
    .max(1, 'Fee rate must be <= 1'),
})

const rechargeFeeSchema = z.object({
  enabled: z.boolean(),
  min_topup_usd: z.coerce.number().min(0, 'Minimum topup must be >= 0'),
  fee_rules: z.array(feeRuleSchema),
})

type RechargeFeeFormValues = z.infer<typeof rechargeFeeSchema>

export type RechargeFeeDefaultValues = RechargeFeeFormValues

type RechargeFeeRulesSectionProps = {
  defaultValues: RechargeFeeDefaultValues
}

export function RechargeFeeRulesSection({
  defaultValues,
}: RechargeFeeRulesSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const form = useForm<RechargeFeeFormValues>({
    resolver: zodResolver(rechargeFeeSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fee_rules',
  })

  const onSubmit = async (values: RechargeFeeFormValues) => {
    await updateOption.mutateAsync({
      key: 'recharge_fee_config.enabled',
      value: String(values.enabled),
    })
    await updateOption.mutateAsync({
      key: 'recharge_fee_config.min_topup_usd',
      value: String(values.min_topup_usd),
    })
    await updateOption.mutateAsync({
      key: 'recharge_fee_config.fee_rules',
      value: JSON.stringify(values.fee_rules),
    })
  }

  return (
    <SettingsSection
      title={t('Tiered Recharge Fee')}
      description={t(
        'Configure surcharge rates based on topup amount. Users pay more when charging less.'
      )}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='enabled'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>
                    {t('Enable Tiered Fee')}
                  </FormLabel>
                  <FormDescription>
                    {t(
                      'When enabled, a surcharge is applied based on the topup amount'
                    )}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='min_topup_usd'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Minimum Topup (USD)')}</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>
                  {t('Minimum single topup amount in USD')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <FormLabel>{t('Fee Rules')}</FormLabel>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  append({ min_amount: 0, max_amount: -1, fee_rate: 0 })
                }
              >
                <Plus className='mr-1 h-4 w-4' />
                {t('Add Rule')}
              </Button>
            </div>
            <p className='text-muted-foreground text-xs'>
              {t(
                'Set max_amount to -1 for "unlimited". Ranges are min ≤ amount < max.'
              )}
            </p>
            <div className='space-y-2'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 rounded-md border p-3'
                >
                  <FormField
                    control={form.control}
                    name={`fee_rules.${index}.min_amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs'>
                          {t('Min (USD)')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            min='0'
                            className='h-8 text-sm'
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`fee_rules.${index}.max_amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs'>
                          {t('Max (USD, -1=∞)')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            className='h-8 text-sm'
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`fee_rules.${index}.fee_rate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs'>
                          {t('Rate (0.03=3%)')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.001'
                            min='0'
                            max='1'
                            className='h-8 text-sm'
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 self-end text-destructive hover:text-destructive'
                    onClick={() => remove(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className='text-muted-foreground py-2 text-center text-sm'>
                  {t('No fee rules configured. Add a rule to get started.')}
                </p>
              )}
            </div>
          </div>

          <Button
            type='submit'
            disabled={updateOption.isPending || form.formState.isSubmitting}
          >
            {updateOption.isPending ? t('Saving...') : t('Save Changes')}
          </Button>
        </form>
      </Form>
    </SettingsSection>
  )
}
