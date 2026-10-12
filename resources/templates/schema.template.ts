import { z } from "zod";

export const createEntitySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255).trim(),
});

export const updateEntitySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255).trim(),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;
