function shopNameFromSession(session) {
  const s = session?.shopId;
  if (s && typeof s === 'object' && s.fullName) {
    return s.fullName;
  }
  return 'Shop';
}

function shopAvatarFromSession(session) {
  const s = session?.shopId;
  if (s && typeof s === 'object' && s.avatar) {
    return s.avatar;
  }
  return `https://via.placeholder.com/96?text=${encodeURIComponent(shopNameFromSession(session).slice(0, 2))}`;
}

/** Map API row from GET /api/livestream/sessions/live to discovery card props */
export function mapPublicLiveSessionToItem(row) {
  const shopLabel = shopNameFromSession(row);
  return {
    id: String(row._id),
    titleLine: row.title || 'Live stream',
    shopLabel,
    avatarUrl: shopAvatarFromSession(row),
    subtitle:
      typeof row.viewerCount === 'number' ? `${row.viewerCount} watching` : 'Live now',
    coverUrl: row.coverImage || undefined,
    shopId: row.shopId,
    viewerCount: typeof row.viewerCount === 'number' ? row.viewerCount : 0,
  };
}
