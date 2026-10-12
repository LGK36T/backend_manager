import { Request, Response, NextFunction } from "express";
import * as EntityService from "../services/entity";
import { sendResponse } from "../utils/sendResponse";

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const result = await EntityService.getAll(); sendResponse(req, res, result); } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const item = await EntityService.getById(req.params.id as string); sendResponse(req, res, item); } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const item = await EntityService.create(req.body); sendResponse(req, res, item, 201); } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const item = await EntityService.update(req.params.id as string, req.body); sendResponse(req, res, item, 200); } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const result = await EntityService.remove(req.params.id as string); sendResponse(req, res, result); } catch (err) { next(err); }
}
