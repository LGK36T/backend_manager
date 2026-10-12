import pool from "../utils/database";
import * as queries from "../queries/entity";
import { IEntity, IEntityGetAllResponse } from "../interfaces/models/entity";

export async function getAll(): Promise<IEntityGetAllResponse> {
  const result = await pool.query(queries.getAll);
  return result.rows[0]?.data ?? { data: [], total: 0 };
}

export async function getById(id: string): Promise<IEntity | null> {
  const result = await pool.query(queries.getById, [id]);
  return result.rows[0]?.data ?? null;
}

export async function create(name: string): Promise<IEntity> {
  const result = await pool.query(queries.create, [name]);
  return result.rows[0].data;
}

export async function update(id: string, name: string): Promise<IEntity> {
  const result = await pool.query(queries.update, [id, name]);
  return result.rows[0].data;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query(queries.remove, [id]);
  return result.rows[0]?.data?.deleted ?? true;
}
