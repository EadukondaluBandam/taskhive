const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const parseCursorPagination = (query = {}) => {
  const limit = Math.min(toPositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const cursor = typeof query.cursor === "string" && query.cursor.trim() ? query.cursor.trim() : null;
  return { limit, cursor };
};

const buildCursorResponse = (items, limit, cursorField = "id") => {
  const hasMore = items.length > limit;
  const slice = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && slice.length > 0 ? slice[slice.length - 1][cursorField] : null;
  return {
    items: slice,
    pageInfo: {
      limit,
      hasMore,
      nextCursor
    }
  };
};

module.exports = {
  parseCursorPagination,
  buildCursorResponse,
  DEFAULT_LIMIT,
  MAX_LIMIT
};
