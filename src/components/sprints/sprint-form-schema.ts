import { z } from "zod"

export const sprintSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required.")
      .min(3, "Name must be at least 3 characters.")
      .max(50, "Name must be at most 50 characters."),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  })

export type SprintFormValues = z.infer<typeof sprintSchema>
