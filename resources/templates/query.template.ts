export const getAll = `SELECT app.entity_get_all() AS data`;
export const getById = `SELECT app.entity_get_by_id($1) AS data`;
export const create = `SELECT app.entity_create($1) AS data`;
export const update = `SELECT app.entity_update($1, $2) AS data`;
export const remove = `SELECT app.entity_delete($1) AS data`;
