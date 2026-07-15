import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import type { DateRange, Matcher } from "react-day-picker"

import type { SprintFormValues } from "@/components/sprints/sprint-form-schema"
import {
  findLatestSelectableEnd,
  formatSprintDate,
  formatSprintDay,
  isRangeAvailable,
  parseSprintDate,
} from "@/components/sprints/sprint-dates"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type SprintFormFieldsProps = {
  form: UseFormReturn<SprintFormValues>
  idPrefix: string
  unavailableRanges: DateRange[]
}

export function SprintFormFields({
  form,
  idPrefix,
  unavailableRanges,
}: SprintFormFieldsProps) {
  const { errors } = form.formState

  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")

  const start = parseSprintDate(startDate)
  const end = parseSprintDate(endDate)

  const latestSelectableEnd = start
    ? findLatestSelectableEnd(start, unavailableRanges)
    : undefined

  const endDisabled: Matcher[] = [...unavailableRanges]
  if (start) endDisabled.push({ before: start })
  if (latestSelectableEnd) endDisabled.push({ after: latestSelectableEnd })

  const shouldValidate = form.formState.isSubmitted

  function selectStart(day: Date) {
    form.setValue("startDate", formatSprintDate(day), { shouldValidate })

    const keepsEnd =
      end && end >= day && isRangeAvailable(day, end, unavailableRanges)

    if (!keepsEnd) {
      form.setValue("endDate", "", { shouldValidate })
    }
  }

  function selectEnd(day: Date) {
    form.setValue("endDate", formatSprintDate(day), { shouldValidate })
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
        <Input
          id={`${idPrefix}-name`}
          aria-invalid={!!errors.name}
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-start-date`}>Start date</FieldLabel>
          <SprintDatePicker
            id={`${idPrefix}-start-date`}
            value={start}
            placeholder="Pick a start date"
            hasError={!!errors.startDate}
            disabledDays={unavailableRanges}
            onSelect={selectStart}
          />
          <FieldError errors={[errors.startDate]} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${idPrefix}-end-date`}>End date</FieldLabel>
          <SprintDatePicker
            id={`${idPrefix}-end-date`}
            value={end}
            placeholder={start ? "Pick an end date" : "Pick a start date first"}
            hasError={!!errors.endDate}
            disabledDays={endDisabled}
            defaultMonth={start}
            isDisabled={!start}
            onSelect={selectEnd}
          />
          <FieldError errors={[errors.endDate]} />
        </Field>
      </div>
    </FieldGroup>
  )
}

type SprintDatePickerProps = {
  id: string
  value: Date | undefined
  placeholder: string
  hasError: boolean
  disabledDays: Matcher[]
  onSelect: (day: Date) => void
  defaultMonth?: Date
  isDisabled?: boolean
}

function SprintDatePicker({
  id,
  value,
  placeholder,
  hasError,
  disabledDays,
  onSelect,
  defaultMonth,
  isDisabled,
}: SprintDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const label = value ? formatSprintDay(formatSprintDate(value)) : null

  function handleSelect(day: Date | undefined) {
    if (!day) return

    onSelect(day)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={isDisabled}
          aria-invalid={hasError}
          className={cn(
            "w-full justify-start font-normal",
            !label && "text-muted-foreground"
          )}
        >
          <CalendarIcon />
          {label ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-60 w-auto p-0" align="start">
        <Calendar
          autoFocus
          mode="single"
          showOutsideDays={false}
          selected={value}
          defaultMonth={value ?? defaultMonth}
          disabled={disabledDays}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
