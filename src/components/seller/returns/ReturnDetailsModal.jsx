import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Drawer, Button, Form, Alert, Image, Spin, message, Input, Steps } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Truck, Hand, Undo2, PackageCheck, PackagePlus, Handshake, RefreshCcw } from 'lucide-react';
import rmaService from '@services/api/rmaService';
import DeliveryTrackingMap from '@components/buyer/DeliveryTrackingMap';
import trackingStyles from '@assets/styles/buyer/Order/RmaTrackingSteps.module.css';

const { TextArea } = Input;

const isTrackingDebugEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('trackingDebug');
    if (fromQuery === '1' || fromQuery === 'true') {
      return true;
    }

    const fromStorage = window.localStorage.getItem('gzm_tracking_debug');
    return fromStorage === '1' || fromStorage === 'true';
  } catch (_err) {
    return false;
  }
};

const debugReturnTracking = () => {};

const normalizeAddressText = (value, fallback = '') => {
  if (!value) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  if (typeof value === 'object') {
    const candidates = [value.fullAddress, value.formattedAddress, value.address, value.street];
    const selected = candidates.find((item) => typeof item === 'string' && item.trim());
    if (selected) {
      return selected.trim();
    }
  }

  return String(value).trim() || fallback;
};

const ReturnDetailsModal = ({ visible, returnRequest, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [legOneCompleted, setLegOneCompleted] = useState(false);
  const [legTwoCompleted, setLegTwoCompleted] = useState(false);
  const [exchangeLegOneCompleted, setExchangeLegOneCompleted] = useState(false);
  const [exchangeLegTwoCompleted, setExchangeLegTwoCompleted] = useState(false);
  const [receiptConfirmed, setReceiptConfirmed] = useState(false);
  const [liveReturnRequest, setLiveReturnRequest] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadLatestReturnRequest = async () => {
      if (!visible || !returnRequest?._original?._id) {
        return;
      }

      try {
        const response = await rmaService.getReturnRequestById(returnRequest._original._id);
        if (!cancelled && response?.data) {
          setLiveReturnRequest(response.data);
        }
      } catch (err) {
        void err;
      }
    };

    loadLatestReturnRequest();

    return () => {
      cancelled = true;
    };
  }, [visible, returnRequest?._original?._id]);

  const trackingSourceRequest = useMemo(
    () => liveReturnRequest || returnRequest?._original || null,
    [liveReturnRequest, returnRequest?._original]
  );

  const handleRespond = async (decision, resolution) => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);

      const response = await rmaService.respondToReturnRequest(returnRequest._original._id, {
        decision,
        resolution,
        notes: values.notes || '',
      });

      message.success(
        decision === 'approve'
          ? `Request approved with ${resolution?.toUpperCase()} resolution`
          : `Return request ${decision}d successfully!`
      );

      if (onSuccess) {
        onSuccess(response.data, {
          keepOpen: decision === 'approve',
        });
      }

      form.resetFields();
      if (decision !== 'approve') {
        onClose();
      }
    } catch (err) {
      void err;
      if (err.errorFields) {
        // Form validation error
        return;
      }
      setError(err.response?.data?.message || `Failed to ${decision} return request`);
      message.error(`Failed to ${decision} return request`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rmaService.processRefund(returnRequest._original._id);

      message.success(
        `Refund processed successfully! ${response.data.coinsAdded} coins added to customer wallet.`
      );

      if (onSuccess) {
        onSuccess(response.data);
      }
      // keep drawer open so seller can choose post-receipt actions
      setReceiptConfirmed(true);
    } catch (err) {
      void err;
      setError(err.response?.data?.message || 'Failed to process refund');
      message.error('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      setLoading(true);
      setError(null);

      const values = await form.validateFields();
      const response = await rmaService.confirmItemsReceived(returnRequest._original._id, {
        notes: values.notes || '',
      });

      const payload = response?.data?.data;
      const autoRefund = Boolean(payload?.autoRefund);
      const autoExchange = Boolean(payload?.autoExchange);

      if (autoRefund) {
        message.success('Receipt confirmed. Refund has been auto-credited to buyer GZCoin wallet.');
      } else if (autoExchange) {
        message.success('Receipt confirmed. Exchange has been completed automatically.');
      } else {
        message.success('Receipt confirmed successfully!');
      }

      if (onSuccess) {
        onSuccess(response.data);
      }

      onClose();
    } catch (err) {
      void err;
      if (err.errorFields) {
        return;
      }
      setError(err.response?.data?.message || 'Failed to confirm receipt');
      message.error('Failed to confirm receipt');
    } finally {
      setLoading(false);
    }
  };

  const sourceRequest = trackingSourceRequest || returnRequest?._original || {};
  const isPending = returnRequest?.status === 'pending';
  const isApproved = returnRequest?.status === 'approved';
  const isItemsReturned = returnRequest?.status === 'items_returned';
  const isProcessing = returnRequest?.status === 'processing';
  const canExchange = Boolean(
    sourceRequest?.exchangeEligibility?.canExchange ||
    returnRequest?.exchangeEligibility?.canExchange
  );
  const logistics = sourceRequest?.logistics || {};
  const logisticsSteps = Array.isArray(logistics.steps) ? logistics.steps : [];
  const currentStep = logistics.currentStep;
  const isRefundFlow = sourceRequest?.type === 'refund';
  const isExchangeFlow = sourceRequest?.type === 'exchange';

  const getLogisticsStep = (code) => logisticsSteps.find((step) => step.code === code) || null;
  const isStepCompleted = (code) => Boolean(getLogisticsStep(code)?.completed);

  const timeline = Array.isArray(sourceRequest?.timeline) ? sourceRequest.timeline : [];
  const approvedTimelineAt =
    timeline.find((entry) => entry?.status === 'approved')?.updatedAt || null;
  const legOneTransitStartTime =
    sourceRequest?.sellerResponse?.respondedAt || approvedTimelineAt || null;
  const buildCompletedLegStartTime = (completedAt, durationSeconds = 10) => {
    if (!completedAt) {
      return null;
    }

    const completedMs = new Date(completedAt).getTime();
    if (!Number.isFinite(completedMs)) {
      return null;
    }

    return new Date(Math.max(0, completedMs - durationSeconds * 1000)).toISOString();
  };

  const refundLegOneStartTime = isStepCompleted('seller_to_buyer_in_transit')
    ? buildCompletedLegStartTime(getLogisticsStep('seller_to_buyer_in_transit')?.completedAt)
    : legOneTransitStartTime;

  const refundLegTwoStartTime = isStepCompleted('buyer_to_seller_in_transit')
    ? buildCompletedLegStartTime(getLogisticsStep('buyer_to_seller_in_transit')?.completedAt)
    : getLogisticsStep('buyer_confirmed_handover')?.completedAt || null;

  const exchangeLegOneStartTime = isStepCompleted('shipper_deliver_and_collect')
    ? buildCompletedLegStartTime(getLogisticsStep('shipper_deliver_and_collect')?.completedAt)
    : legOneTransitStartTime;

  const exchangeLegTwoStartTime = isStepCompleted('shipper_return_to_seller')
    ? buildCompletedLegStartTime(getLogisticsStep('shipper_return_to_seller')?.completedAt)
    : getLogisticsStep('shipper_deliver_and_collect')?.completedAt || null;

  useEffect(() => {
    if (!returnRequest) {
      return;
    }

    const refundLegOneDone =
      isStepCompleted('seller_to_buyer_in_transit') ||
      isStepCompleted('buyer_confirmed_handover') ||
      ['buyer_to_seller_in_transit', 'seller_confirmed_faulty_received'].includes(currentStep) ||
      ['items_returned', 'processing', 'completed'].includes(returnRequest?.status);

    const refundLegTwoDone =
      isStepCompleted('buyer_to_seller_in_transit') ||
      isStepCompleted('seller_confirmed_faulty_received') ||
      ['seller_confirmed_faulty_received'].includes(currentStep) ||
      ['processing', 'completed'].includes(returnRequest?.status);

    const exchangeLegOneDone =
      isStepCompleted('shipper_deliver_and_collect') ||
      ['shipper_return_to_seller', 'exchange_completed'].includes(currentStep) ||
      ['items_returned', 'processing', 'completed'].includes(returnRequest?.status);

    const exchangeLegTwoDone =
      isStepCompleted('shipper_return_to_seller') ||
      isStepCompleted('exchange_completed') ||
      ['exchange_completed'].includes(currentStep) ||
      ['processing', 'completed'].includes(returnRequest?.status);

    if (refundLegOneDone) {
      setLegOneCompleted(true);
    }
    if (refundLegTwoDone) {
      setLegTwoCompleted(true);
    }
    if (exchangeLegOneDone) {
      setExchangeLegOneCompleted(true);
    }
    if (exchangeLegTwoDone) {
      setExchangeLegTwoCompleted(true);
    }
  }, [currentStep, logisticsSteps, returnRequest?.status]);

  const refundTrackingSteps = [
    {
      code: 'seller_to_buyer_in_transit',
      title: 'Leg 1: Seller to Buyer',
      description: 'Courier is moving toward buyer',
      icon: <Truck size={14} />,
    },
    {
      code: 'buyer_confirmed_handover',
      title: 'Buyer confirmed handover',
      description: 'Buyer handed faulty item to courier',
      icon: <Hand size={14} />,
    },
    {
      code: 'buyer_to_seller_in_transit',
      title: 'Leg 2: Buyer back to Seller',
      description: 'Courier is returning to seller',
      icon: <Undo2 size={14} />,
    },
    {
      code: 'seller_confirmed_faulty_received',
      title: 'Seller confirmed receiving faulty item',
      description: 'Refund can now be finalized',
      icon: <PackageCheck size={14} />,
    },
  ];

  const exchangeTrackingSteps = [
    {
      code: 'seller_pack_and_handover',
      title: 'Seller Packs Replacement',
      description: 'Seller hands replacement item to courier',
      icon: <PackagePlus size={14} />,
    },
    {
      code: 'shipper_deliver_and_collect',
      title: 'Deliver & Collect',
      description: 'Courier delivers replacement and collects faulty item',
      icon: <Handshake size={14} />,
    },
    {
      code: 'shipper_return_to_seller',
      title: 'Return to Seller',
      description: 'Courier returns faulty item to seller',
      icon: <RefreshCcw size={14} />,
    },
    {
      code: 'exchange_completed',
      title: 'Exchange Completed',
      description: 'Replacement flow completed successfully',
      icon: <PackageCheck size={14} />,
    },
  ];

  const activeRefundStepIndex = (() => {
    const byCurrent = refundTrackingSteps.findIndex((step) => step.code === currentStep);
    if (byCurrent >= 0) {
      return byCurrent;
    }

    const lastCompleted = [...refundTrackingSteps]
      .reverse()
      .find((step) => isStepCompleted(step.code));

    if (!lastCompleted) {
      return 0;
    }

    return refundTrackingSteps.findIndex((step) => step.code === lastCompleted.code);
  })();

  const activeExchangeStepIndex = (() => {
    const byCurrent = exchangeTrackingSteps.findIndex((step) => step.code === currentStep);
    if (byCurrent >= 0) {
      return byCurrent;
    }

    if (returnRequest?.status === 'completed') {
      return exchangeTrackingSteps.length - 1;
    }

    const lastCompleted = [...exchangeTrackingSteps]
      .reverse()
      .find((step) => isStepCompleted(step.code));
    if (!lastCompleted) {
      return 0;
    }
    return exchangeTrackingSteps.findIndex((step) => step.code === lastCompleted.code);
  })();

  const canSellerConfirmReceived =
    (isRefundFlow &&
      (currentStep === 'buyer_to_seller_in_transit' || isItemsReturned || isProcessing) &&
      !isStepCompleted('seller_confirmed_faulty_received') &&
      (legTwoCompleted || isStepCompleted('buyer_to_seller_in_transit'))) ||
    (isExchangeFlow &&
      (currentStep === 'shipper_return_to_seller' || isItemsReturned || isProcessing) &&
      !isStepCompleted('exchange_completed') &&
      (exchangeLegTwoCompleted || isStepCompleted('shipper_return_to_seller')));

  const getTrackingCoordinates = () => {
    const order = trackingSourceRequest?.orderId || {};
    const sellerProfile =
      trackingSourceRequest?.items?.[0]?.productId?.sellerId ||
      trackingSourceRequest?.items?.[0]?.orderItemId?.productId?.sellerId ||
      {};

    const sellerFromTracking = order?.trackingCoordinates?.seller || {};
    const buyerFromTracking =
      order?.trackingCoordinates?.buyer ||
      order?.trackingCoordinates?.user ||
      order?.trackingCoordinates?.customer ||
      {};

    const sellerAddress =
      normalizeAddressText(sellerProfile?.location?.address) ||
      normalizeAddressText(sellerProfile?.location?.formattedAddress) ||
      normalizeAddressText(sellerProfile?.address) ||
      'Địa chỉ người bán chưa cập nhật';

    const buyerAddress =
      normalizeAddressText(order?.userId?.location?.address) ||
      normalizeAddressText(order?.userId?.location?.formattedAddress) ||
      normalizeAddressText(order?.userId?.address) ||
      'Địa chỉ người mua chưa cập nhật';

    const sellerLat =
      sellerFromTracking?.lat ??
      sellerProfile?.location?.lat ??
      order?.items?.[0]?.productId?.sellerId?.location?.lat;
    const sellerLng =
      sellerFromTracking?.lng ??
      sellerProfile?.location?.lng ??
      order?.items?.[0]?.productId?.sellerId?.location?.lng;
    const buyerLat = buyerFromTracking?.lat ?? order?.userId?.location?.lat;
    const buyerLng = buyerFromTracking?.lng ?? order?.userId?.location?.lng;

    const seller = {
      lat: sellerLat ?? 16.0471,
      lng: sellerLng ?? 108.2062,
      address: sellerAddress,
    };

    const buyer = {
      lat: buyerLat ?? 16.0678,
      lng: buyerLng ?? 108.2208,
      address: buyerAddress,
    };

    return { seller, buyer };
  };

  const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') {
      return false;
    }
    return (
      /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i.test(url) ||
      url.includes('video') ||
      url.includes('blob:')
    );
  };

  return (
    <Drawer title="Return Request Details" open={visible} onClose={onClose} width={800}>
      {returnRequest && returnRequest._original ? (
        <Spin spinning={loading}>
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Basic Info */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>Return ID:</strong>
                <div>{returnRequest.id}</div>
              </div>
              <div>
                <strong>Order ID:</strong>
                <div>{returnRequest.orderId}</div>
              </div>
              <div>
                <strong>Customer:</strong>
                <div>{returnRequest.customer}</div>
              </div>
              <div>
                <strong>Date Requested:</strong>
                <div>{returnRequest.date}</div>
              </div>
              <div>
                <strong>Resolution:</strong>
                <div style={{ textTransform: 'capitalize' }}>
                  {returnRequest._original?.type || 'undetermined'}
                </div>
              </div>
              <div>
                <strong>Status:</strong>
                <div>
                  <span
                    className={`badge bg-${
                      returnRequest?.status === 'pending'
                        ? 'warning'
                        : returnRequest?.status === 'approved'
                          ? 'success'
                          : returnRequest?.status === 'rejected'
                            ? 'danger'
                            : 'info'
                    }`}
                  >
                    {returnRequest?.status?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 16 }}>
            <strong>Reason:</strong>
            <div style={{ marginTop: 4, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              {returnRequest?.reason}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <strong>Description:</strong>
            <div style={{ marginTop: 4, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              {returnRequest._original?.description || 'No description provided'}
            </div>
          </div>

          {/* Evidence (photos & videos) */}
          {returnRequest._original?.images?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>Evidence:</strong>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {returnRequest._original.images.map((url, index) => {
                  if (isVideoUrl(url)) {
                    return (
                      <div key={index} style={{ width: 200, borderRadius: 6, overflow: 'hidden' }}>
                        <video
                          controls
                          src={url}
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            background: '#000',
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  }

                  // default: image
                  return (
                    <Image.PreviewGroup key={index}>
                      <Image
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                    </Image.PreviewGroup>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div style={{ marginBottom: 24 }}>
            <strong>Items to Return:</strong>
            <table className="table table-sm mt-2">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Refund Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{returnRequest.product}</td>
                  <td>{returnRequest.category}</td>
                  <td>{returnRequest._original?.items?.length || 1}</td>
                  <td style={{ textAlign: 'right' }}>
                    {returnRequest.price.toLocaleString('vi-VN')}₫
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Response Form (only for pending requests) */}
          {isPending && (
            <Form form={form} layout="vertical">
              <Form.Item
                label="Response Notes (Optional)"
                name="notes"
                rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Add any notes for the customer..."
                  maxLength={500}
                />
              </Form.Item>

              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  type="primary"
                  icon={<Truck />}
                  onClick={() =>
                    handleRespond(
                      'approve',
                      returnRequest._original?.type &&
                        ['refund', 'exchange'].includes(returnRequest._original.type)
                        ? returnRequest._original.type
                        : 'refund'
                    )
                  }
                  loading={loading}
                  block
                >
                  Receive Items Back
                </Button>
              </div>

              <div style={{ marginTop: 12 }}>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleRespond('reject')}
                  loading={loading}
                  block
                >
                  Reject Request
                </Button>
              </div>
            </Form>
          )}

          {isExchangeFlow &&
            ['approved', 'items_returned', 'processing', 'completed'].includes(
              returnRequest?.status
            ) && (
              <div style={{ marginBottom: 12 }}>
                <Alert
                  message="Exchange logistics is active"
                  description="Two-leg exchange tracking: seller to buyer replacement, then buyer to seller faulty-item return."
                  type="info"
                  style={{ marginBottom: 12 }}
                />

                <div
                  className={trackingStyles.rmaTrackingCard}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  <Steps
                    current={activeExchangeStepIndex}
                    size="small"
                    items={exchangeTrackingSteps.map((step, index) => {
                      const completed =
                        isStepCompleted(step.code) ||
                        (returnRequest.status === 'completed' &&
                          step.code === 'exchange_completed');

                      return {
                        title: step.title,
                        content: step.description,
                        icon: step.icon,
                        status: completed
                          ? 'finish'
                          : index === activeExchangeStepIndex
                            ? 'process'
                            : 'wait',
                      };
                    })}
                  />
                </div>

                {(currentStep === 'seller_pack_and_handover' ||
                  currentStep === 'shipper_deliver_and_collect' ||
                  (returnRequest.status === 'approved' && !exchangeLegOneCompleted)) && (
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>
                      Map - Leg 1 (Seller to Buyer)
                    </strong>
                    <DeliveryTrackingMap
                      sellerCoords={getTrackingCoordinates().seller}
                      buyerCoords={getTrackingCoordinates().buyer}
                      duration={10}
                      startTime={exchangeLegOneStartTime}
                      syncRoom={returnRequest._original?._id || returnRequest._original?._id}
                      syncTag="exchange_leg_1"
                      onDeliveryComplete={() => setExchangeLegOneCompleted(true)}
                    />
                  </div>
                )}

                {(currentStep === 'shipper_return_to_seller' ||
                  currentStep === 'exchange_completed' ||
                  returnRequest.status === 'processing' ||
                  returnRequest.status === 'completed' ||
                  exchangeLegOneCompleted) && (
                  <div>
                    <strong style={{ display: 'block', marginBottom: 8 }}>
                      Map - Leg 2 (Buyer back to Seller)
                    </strong>
                    <DeliveryTrackingMap
                      sellerCoords={getTrackingCoordinates().buyer}
                      buyerCoords={getTrackingCoordinates().seller}
                      duration={10}
                      startTime={exchangeLegTwoStartTime}
                      syncRoom={returnRequest._original?._id || returnRequest._original?._id}
                      syncTag="exchange_leg_2"
                      onDeliveryComplete={() => setExchangeLegTwoCompleted(true)}
                    />
                    {exchangeLegTwoCompleted && returnRequest.status !== 'completed' && (
                      <Alert
                        type="info"
                        message="Waiting exchange completion"
                        description="Leg 2 reached seller. Seller can now process exchange completion."
                        style={{ marginTop: 12 }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

          {(sourceRequest?.type === 'refund' || sourceRequest?.type === 'undetermined') &&
            ['approved', 'items_returned', 'processing'].includes(returnRequest.status) && (
              <div style={{ marginBottom: 12 }}>
                <Alert
                  message="Refund two-leg logistics is active"
                  description="Step 1: seller to buyer. Step 2: buyer back to seller after buyer confirms handover."
                  type="info"
                  style={{ marginBottom: 12 }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div className={trackingStyles.rmaTrackingCard} style={{ width: '100%' }}>
                    <Steps
                      current={activeRefundStepIndex}
                      size="small"
                      items={refundTrackingSteps.map((step, index) => {
                        const completed = isStepCompleted(step.code);
                        return {
                          title: step.title,
                          content: step.description,
                          icon: step.icon,
                          status: completed
                            ? 'finish'
                            : index === activeRefundStepIndex
                              ? 'process'
                              : 'wait',
                        };
                      })}
                    />
                  </div>
                </div>

                {(currentStep === 'seller_to_buyer_in_transit' ||
                  returnRequest.status === 'approved') &&
                  !isStepCompleted('buyer_confirmed_handover') && (
                    <div style={{ marginBottom: 16 }}>
                      <strong style={{ display: 'block', marginBottom: 8 }}>
                        Map - Leg 1 (Seller to Buyer)
                      </strong>
                      <DeliveryTrackingMap
                        sellerCoords={getTrackingCoordinates().seller}
                        buyerCoords={getTrackingCoordinates().buyer}
                        duration={10}
                        startTime={refundLegOneStartTime}
                        syncRoom={returnRequest._original?._id || returnRequest._original?._id}
                        syncTag="refund_leg_1"
                        onDeliveryComplete={() => setLegOneCompleted(true)}
                      />
                      {legOneCompleted && (
                        <Alert
                          type="info"
                          message="Waiting buyer confirmation"
                          description="Buyer will see a handover confirmation button after leg 1 is completed."
                          style={{ marginTop: 12 }}
                        />
                      )}
                    </div>
                  )}

                {(currentStep === 'buyer_to_seller_in_transit' ||
                  isStepCompleted('buyer_to_seller_in_transit') ||
                  isStepCompleted('seller_confirmed_faulty_received') ||
                  isItemsReturned ||
                  isProcessing) && (
                  <div>
                    <strong style={{ display: 'block', marginBottom: 8 }}>
                      Map - Leg 2 (Buyer back to Seller)
                    </strong>
                    <DeliveryTrackingMap
                      sellerCoords={getTrackingCoordinates().buyer}
                      buyerCoords={getTrackingCoordinates().seller}
                      duration={10}
                      startTime={refundLegTwoStartTime}
                      syncRoom={returnRequest._original?._id || returnRequest._original?._id}
                      syncTag="refund_leg_2"
                      onDeliveryComplete={() => setLegTwoCompleted(true)}
                    />
                  </div>
                )}
              </div>
            )}

          {/* Confirm Receipt */}
          {(isItemsReturned ||
            currentStep === 'buyer_to_seller_in_transit' ||
            currentStep === 'shipper_return_to_seller') &&
            (isRefundFlow || isExchangeFlow) && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  message={
                    isExchangeFlow ? 'Ready to complete exchange' : 'Ready to confirm receipt'
                  }
                  description={
                    isExchangeFlow
                      ? 'After seller confirms receipt of faulty item, exchange request is completed automatically.'
                      : 'After seller confirms receipt of faulty item, refund amount is auto-credited to buyer GZCoin wallet.'
                  }
                  type="info"
                  style={{ marginBottom: 12 }}
                />
                <Form form={form} layout="vertical">
                  <Form.Item
                    label="Receipt Notes (Optional)"
                    name="notes"
                    rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
                  >
                    <TextArea rows={3} placeholder="Confirm receipt notes..." maxLength={500} />
                  </Form.Item>
                </Form>
                <Button
                  type="primary"
                  onClick={async () => {
                    await handleConfirmReceipt();
                    setReceiptConfirmed(true);
                  }}
                  loading={loading}
                  disabled={
                    !canSellerConfirmReceived &&
                    !isStepCompleted(
                      isExchangeFlow ? 'exchange_completed' : 'seller_confirmed_faulty_received'
                    )
                  }
                  block
                >
                  {isExchangeFlow
                    ? 'Confirm Faulty Item Received & Complete Exchange'
                    : 'Confirm Faulty Item Received'}
                </Button>

                {/* After receipt confirmed, show action choices */}
                {receiptConfirmed && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button type="primary" onClick={handleProcessRefund} loading={loading} block>
                        Refund
                      </Button>
                      {canExchange && (
                        <Button
                          type="default"
                          onClick={async () => {
                            try {
                              setLoading(true);
                              const resp = await rmaService.processExchange(
                                returnRequest._original._id
                              );
                              message.success('Exchange processed successfully');
                              if (onSuccess) {
                                onSuccess(resp.data);
                              }
                              onClose();
                            } catch (err) {
                              void err;
                              message.error('Failed to process exchange');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          loading={loading}
                          block
                        >
                          Exchange
                        </Button>
                      )}
                      <Button
                        danger
                        onClick={() => handleRespond('reject')}
                        loading={loading}
                        block
                      >
                        Reject Request
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Manual processing for processing state */}
          {isProcessing && returnRequest._original?.type === 'refund' && (
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleProcessRefund} loading={loading} block>
                Process Refund ({returnRequest.price.toLocaleString('vi-VN')}₫)
              </Button>
            </div>
          )}

          {/* Close Button */}
          {!isPending && !isApproved && !isItemsReturned && !isProcessing && (
            <Button type="default" onClick={onClose} block>
              Close
            </Button>
          )}
        </Spin>
      ) : null}
    </Drawer>
  );
};

ReturnDetailsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  returnRequest: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default ReturnDetailsModal;
