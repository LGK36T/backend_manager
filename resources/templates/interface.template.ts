export interface IEntity {
  id: string;
  name: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
}

export interface IEntityGetAllResponse {
  data: IEntity[];
  total: number;
}

export interface IEntityCreatePayload {
  name: string;
}

export interface IEntityUpdatePayload {
  name: string;
}
