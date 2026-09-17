import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  category: z.string(),
  priority: z.string(),
  vendor: z.string().optional(),
  amount: z.number().optional(),
  dueDate: z.string().optional(),
  branch: z.string().optional(),
  paymentMethod: z.string().optional(),
  taxCode: z.string().optional(),
})

export type Task = z.infer<typeof taskSchema>
