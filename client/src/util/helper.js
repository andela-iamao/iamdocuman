export default (prop, field) => {
  if (prop) {
    return prop[field] || '';
  }
  return '';
};

function paginate (handlePageChange, paginationMeta) {
  const paginated = [];
  for (let count = 0; count < paginationMeta.page_count; count += 1) {
    paginated.push(
      <span className={
        paginationMeta.page === (count + 1) ? 'active' : 'link'
      } onClick={
        paginationMeta.page === (count + 1) ? null : handlePageChange
      }>
        Page { count + 1 }
      </span>
    );
  }
}
