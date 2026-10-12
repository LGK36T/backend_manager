import * as EntityModel from "../models/entity";
import { NotFoundError } from "../utils/errors";
import { IEntity, IEntityGetAllResponse } from "../interfaces/models/entity";
import { CreateEntityInput, UpdateEntityInput } from "../schemas/entity";

export async function getAll(): Promise<IEntityGetAllResponse> {
  return EntityModel.getAll();
}

export async function getById(id: string): Promise<IEntity> {
  const item = await EntityModel.getById(id);
  if (!item) {
    throw new NotFoundError("Entidad");
  }
  return item;
}

export async function create(data: CreateEntityInput): Promise<IEntity> {
  return EntityModel.create(data.name);
}

export async function update(id: string, data: UpdateEntityInput): Promise<IEntity> {
  const existing = await EntityModel.getById(id);
  if (!existing) {
    throw new NotFoundError("Entidad");
  }
  return EntityModel.update(id, data.name);
}

export async function remove(id: string): Promise<boolean> {
  const existing = await EntityModel.getById(id);
  if (!existing) {
    throw new NotFoundError("Entidad");
  }
  return EntityModel.remove(id);
}
