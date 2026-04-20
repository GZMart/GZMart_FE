export const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const buildDisplayLabel = (report) => {
  if (!report) {
    return 'Report';
  }
  return report.reportNumber || report.title || report._id;
};

export const stripHtml = (value) => String(value || '').replace(/<[^>]+>/g, '');

export const formatCompactDate = (value) => {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleDateString('vi-VN');
};

export const formatCompactMoney = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) {
    return '0 VND';
  }
  return amount.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });
};

export const getOrderItems = (order) => order?.items || order?.orderItems || [];

export const buildOrderLabelText = (order) => {
  const items = getOrderItems(order);
  const orderNumber = order?.orderNumber || order?._id || 'Unknown';
  return `Order #${orderNumber} - ${formatCompactDate(order?.createdAt)} - ${formatCompactMoney(order?.totalPrice)} - ${items.length} items`;
};

export const extractInteractedSellers = (orders = []) => {
  const map = new Map();
  orders.forEach((order) => {
    const items = getOrderItems(order);
    items.forEach((item) => {
      const seller = item?.productId?.sellerId;
      const sellerId = seller?._id || seller?.id;
      if (!sellerId) {
        return;
      }

      if (!map.has(sellerId)) {
        map.set(sellerId, {
          _id: sellerId,
          fullName: seller?.fullName,
          email: seller?.email,
          avatar: seller?.avatar,
          interactedOrderCount: 1,
        });
      } else {
        const existing = map.get(sellerId);
        existing.interactedOrderCount += 1;
      }
    });
  });

  return [...map.values()];
};

export const getActorName = (actor) => {
  if (!actor) {
    return 'System';
  }
  if (typeof actor === 'string') {
    return actor;
  }
  return actor.fullName || actor.email || actor._id || 'System';
};

export const isVideoFile = (file) => file?.type?.startsWith('video/');

export const buildPreviewItem = (file) => ({
  url: URL.createObjectURL(file),
  type: isVideoFile(file) ? 'video' : 'image',
  name: file.name,
});
