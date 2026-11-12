export function createPaginator(pool) {
  return async function sendPage(
    req,
    res,
    countSql,
    selectSql,
    values,
    addPreviews,
  ) {
    const requestedPage = req.query.page ?? "1";
    if (
      typeof requestedPage !== "string" ||
      !/^[1-9]\d*$/.test(requestedPage) ||
      !Number.isSafeInteger(Number(requestedPage))
    ) {
      return res.status(400).json({ error: "Choose a valid page." });
    }
    const pageSize = 10;
    const [[count]] = await pool.query(countSql, values);
    const total = Number(count.total);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Number(requestedPage), totalPages);
    const [items] = await pool.query(selectSql, [
      ...values,
      pageSize,
      (page - 1) * pageSize,
    ]);
    if (addPreviews && items.length) await addPreviews(items);
    res.json({ items, page, pageSize, total, totalPages });
  };
}
