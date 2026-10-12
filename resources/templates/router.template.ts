import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validateRequest";
import { createEntitySchema, updateEntitySchema } from "../schemas/entity";
import * as EntityController from "../controllers/entity";

const router = Router();

// Endpoints estándar alineados 1:1 con frontend_manager
router.get("/getAll", authenticate, EntityController.getAll);
router.get("/getById/:id", authenticate, EntityController.getById);
router.post("/create", authenticate, validateRequest(createEntitySchema), EntityController.create);
router.put("/update/:id", authenticate, validateRequest(updateEntitySchema), EntityController.update);
router.delete("/delete/:id", authenticate, EntityController.remove);

export default router;
