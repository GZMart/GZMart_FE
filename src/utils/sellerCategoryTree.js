/** Sort sibling categories: featured → product count → order → name (tree order preserved per level). */
export function compareCategoryPeers(a, b) {
  const fa = a.isFeatured ? 1 : 0;
  const fb = b.isFeatured ? 1 : 0;
  if (fb !== fa) {
    return fb - fa;
  }
  const pa = a.productCount ?? 0;
  const pb = b.productCount ?? 0;
  if (pb !== pa) {
    return pb - pa;
  }
  const oa = a.order ?? 0;
  const ob = b.order ?? 0;
  if (oa !== ob) {
    return oa - ob;
  }
  return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
}

export function sortCategoryTree(nodes) {
  if (!nodes?.length) {
    return [];
  }
  return [...nodes]
    .sort(compareCategoryPeers)
    .map((n) => ({
      ...n,
      children: n.children?.length ? sortCategoryTree(n.children) : [],
    }));
}

/**
 * DFS flatten với depth — giống ProductDrawer (dùng cho react-select / form).
 * @param {Array} treeData - cây từ GET /categories/tree
 * @returns {Array<{ depth: number, ... }>}
 */
export function flattenCategoriesFromTree(treeData) {
  const flat = [];
  const flatten = (nodes, depth = 0) => {
    (nodes || []).forEach((node) => {
      flat.push({ ...node, depth });
      if (node.children?.length) {
        flatten(node.children, depth + 1);
      }
    });
  };
  flatten(sortCategoryTree(treeData || []));
  return flat;
}
