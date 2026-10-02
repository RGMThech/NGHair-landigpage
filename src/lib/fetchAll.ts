/**
 * Busca todas as linhas de uma consulta em blocos de 1.000,
 * contornando o limite padrão de linhas por requisição do backend.
 * `build` deve devolver uma consulta nova (com filtros e ordem) a cada chamada.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAll<T = any>(build: () => any, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) return out;
  }
}
