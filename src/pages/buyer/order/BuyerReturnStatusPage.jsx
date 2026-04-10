import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Steps } from 'antd';
import { Truck, Hand, Undo2, PackageCheck, PackagePlus, Handshake, RefreshCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import rmaService from '@services/api/rmaService';
import DeliveryTrackingMap from '@components/buyer/DeliveryTrackingMap';
import socketService from '@services/socket/socketService';
import trackingStyles from '@assets/styles/buyer/Order/RmaTrackingSteps.module.css';

const statusLabelMap = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  items_returned: 'Items Returned',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

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

const BuyerReturnStatusPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  const [loading, setLoading] = useState(true);
  const [returnRequest, setReturnRequest] = useState(null);
  const [legOneCompleted, setLegOneCompleted] = useState(false);
  const [legTwoCompleted, setLegTwoCompleted] = useState(false);
  const [exchangeLegOneCompleted, setExchangeLegOneCompleted] = useState(false);
  const [exchangeLegTwoCompleted, setExchangeLegTwoCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refundLegOneStartTime, setRefundLegOneStartTime] = useState(null);
  const [refundLegTwoStartTime, setRefundLegTwoStartTime] = useState(null);
  const [exchangeLegOneStartTime, setExchangeLegOneStartTime] = useState(null);
  const [exchangeLegTwoStartTime, setExchangeLegTwoStartTime] = useState(null);

  const fetchReturnRequest = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await rmaService.getReturnRequestById(requestId);
      setReturnRequest(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load return status');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchReturnRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    if (!requestId) {
      return;
    }

    socketService.connect(user?._id);
    socketService.setUserId(user?._id);

    const handleRmaUpdated = (payload) => {
      if (payload?.returnRequestId !== requestId) {
        return;
      }
      fetchReturnRequest({ silent: true });
    };

    socketService.on('rma:request-updated', handleRmaUpdated);
    socketService.on(`rma:request-updated:${requestId}`, handleRmaUpdated);
    return () => {
      socketService.off('rma:request-updated', handleRmaUpdated);
      socketService.off(`rma:request-updated:${requestId}`, handleRmaUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, user?._id]);

  // Memoize key properties to use in dependency array
  const logisticsStepsStr = returnRequest?.logistics?.steps?.map((s) => s.code).join(',');

  // Calculate startTime for map animations and sync leg completion flags
  useEffect(() => {
    if (!returnRequest) {
      return;
    }

    const logistics = returnRequest.logistics || {};
    const logisticsSteps = Array.isArray(logistics.steps) ? logistics.steps : [];

    const isStepCompleted = (code) =>
      logisticsSteps.some((step) => step.code === code && step.completed);

    const refundLegs = {
      legOne: ['seller_to_buyer_in_transit', 'buyer_confirmed_handover'],
      legTwo: ['buyer_to_seller_in_transit', 'seller_confirmed_faulty_received'],
    };
    const exchangeLegs = {
      legOne: ['seller_pack_and_handover', 'shipper_deliver_and_collect'],
      legTwo: ['shipper_return_to_seller', 'exchange_completed'],
    };

    const findLegStartTime = (legCodes) => {
      const stepsInLeg = logisticsSteps.filter((s) => legCodes.includes(s.code));
      const earliestWithTime = stepsInLeg
        .filter((s) => s.completedAt)
        .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))[0];
      return earliestWithTime?.completedAt ? new Date(earliestWithTime.completedAt) : null;
    };

    const resolutionType = returnRequest.type;
    const isRefundFlow =
      resolutionType === 'refund' || !resolutionType || resolutionType === 'undetermined';
    const isExchangeFlow = resolutionType === 'exchange';

    // Calculate start times
    if (isRefundFlow) {
      setRefundLegOneStartTime(findLegStartTime(refundLegs.legOne));
      setRefundLegTwoStartTime(findLegStartTime(refundLegs.legTwo));
    }
    if (isExchangeFlow) {
      setExchangeLegOneStartTime(findLegStartTime(exchangeLegs.legOne));
      setExchangeLegTwoStartTime(findLegStartTime(exchangeLegs.legTwo));
    }

    // Sync leg completion flags
    const refundLegOneDone =
      isStepCompleted('seller_to_buyer_in_transit') ||
      isStepCompleted('buyer_confirmed_handover') ||
      ['items_returned', 'processing', 'completed'].includes(returnRequest?.status);

    const refundLegTwoDone =
      isStepCompleted('buyer_to_seller_in_transit') ||
      isStepCompleted('seller_confirmed_faulty_received') ||
      ['processing', 'completed'].includes(returnRequest?.status);

    const exchangeLegOneDone =
      isStepCompleted('seller_pack_and_handover') ||
      isStepCompleted('shipper_deliver_and_collect') ||
      ['items_returned', 'processing', 'completed'].includes(returnRequest?.status);

    const exchangeLegTwoDone =
      isStepCompleted('shipper_return_to_seller') ||
      isStepCompleted('exchange_completed') ||
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
  }, [returnRequest?.status, logisticsStepsStr]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3 mb-0">Loading return/refund status...</p>
      </Container>
    );
  }

  if (!returnRequest) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Return request not found.</Alert>
        <Button variant="outline-primary" onClick={() => navigate('/buyer/profile?tab=orders')}>
          Back to orders
        </Button>
      </Container>
    );
  }

  const resolutionType = returnRequest.type;
  const logistics = returnRequest.logistics || {};
  const logisticsSteps = Array.isArray(logistics.steps) ? logistics.steps : [];
  const currentStep = logistics.currentStep;
  const isRefundFlow =
    resolutionType === 'refund' || !resolutionType || resolutionType === 'undetermined';
  const isExchangeFlow = resolutionType === 'exchange';

  const isStepCompleted = (code) =>
    logisticsSteps.some((step) => step.code === code && step.completed);

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
      title: 'Seller confirmed received faulty item',
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

    if (returnRequest.status === 'completed') {
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

  const canBuyerConfirmHandover =
    isRefundFlow &&
    !isStepCompleted('buyer_confirmed_handover') &&
    (currentStep === 'seller_to_buyer_in_transit' || returnRequest.status === 'approved') &&
    legOneCompleted;

  const canBuyerConfirmExchangeHandover =
    isExchangeFlow &&
    !isStepCompleted('shipper_deliver_and_collect') &&
    (currentStep === 'seller_pack_and_handover' ||
      currentStep === 'shipper_deliver_and_collect' ||
      returnRequest.status === 'approved') &&
    exchangeLegOneCompleted;

  const handleBuyerConfirmHandover = async () => {
    try {
      setSubmitting(true);
      const isExchange = isExchangeFlow;
      await rmaService.confirmBuyerHandover(returnRequest._id, {
        notes: isExchange
          ? 'Buyer confirmed replacement received and faulty item handed to courier'
          : 'Buyer confirmed handover after receiving courier in leg 1',
      });
      toast.success(
        isExchange
          ? 'Confirmed. Faulty item is now returning to seller warehouse.'
          : 'Confirmed. Return shipment is now heading back to seller.'
      );
      await fetchReturnRequest({ silent: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to confirm handover');
    } finally {
      setSubmitting(false);
    }
  };
  const getTrackingCoordinates = () => {
    const order = returnRequest?.orderId || {};

    const sellerFromTracking = order?.trackingCoordinates?.seller || {};
    const buyerFromTracking =
      order?.trackingCoordinates?.buyer ||
      order?.trackingCoordinates?.user ||
      order?.trackingCoordinates?.customer ||
      {};
    const sellerProfile =
      returnRequest?.items?.[0]?.productId?.sellerId ||
      returnRequest?.items?.[0]?.orderItemId?.productId?.sellerId ||
      {};

    const sellerAddress =
      normalizeAddressText(sellerProfile?.location?.address) ||
      normalizeAddressText(sellerProfile?.address) ||
      'Địa chỉ người bán chưa cập nhật';

    const buyerAddress =
      normalizeAddressText(order?.userId?.location?.address) ||
      normalizeAddressText(order?.userId?.address) ||
      'Địa chỉ người mua chưa cập nhật';

    const seller = {
      lat: sellerFromTracking?.lat ?? sellerProfile?.location?.lat ?? 16.0471,
      lng: sellerFromTracking?.lng ?? sellerProfile?.location?.lng ?? 108.2062,
      address: sellerAddress,
      formattedAddress: sellerProfile?.location?.formattedAddress || sellerAddress,
    };

    const buyer = {
      lat: buyerFromTracking?.lat ?? order?.userId?.location?.lat ?? 16.0678,
      lng: buyerFromTracking?.lng ?? order?.userId?.location?.lng ?? 108.2208,
      address: buyerAddress,
      formattedAddress: order?.userId?.location?.formattedAddress || buyerAddress,
    };

    return { seller, buyer };
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Refund / Return Status</h2>
        <Button variant="outline-primary" onClick={() => navigate('/buyer/profile?tab=orders')}>
          Back to Orders
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <div>
                <strong>Request No:</strong> {returnRequest.requestNumber}
              </div>
              <div>
                <strong>Order No:</strong> {returnRequest.orderId?.orderNumber || 'N/A'}
              </div>
            </Col>
            <Col md={6}>
              <div>
                <strong>Status:</strong>{' '}
                <Badge bg="info">
                  {statusLabelMap[returnRequest.status] || returnRequest.status}
                </Badge>
              </div>
              <div>
                <strong>Resolution:</strong>{' '}
                <Badge bg={resolutionType === 'exchange' ? 'warning' : 'primary'}>
                  {resolutionType || 'undetermined'}
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h5>Shipping Benefit</h5>
              <p className="mb-0">
                100% return shipping fee support via GZMart shipping partner when policy applies.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h5>Packing Guide</h5>
              <p className="mb-0">
                Pack full product, accessories, tags, labels and all gifts to avoid dispute.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h5>Important Note</h5>
              <p className="mb-0">
                Record full packing video as mandatory evidence to protect buyer rights.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {isExchangeFlow && (
        <>
          <Alert variant="warning">
            <Alert.Heading>Exchange Logistics Flow</Alert.Heading>
            <ol className="mb-0">
              <li>Seller packs replacement item and hands over to shipper.</li>
              <li>Shipper delivers replacement to buyer and collects faulty item.</li>
              <li>Shipper returns faulty item to seller warehouse.</li>
            </ol>
          </Alert>

          <Card className="mt-3">
            <Card.Body>
              <h5 className="mb-3">Exchange Tracking Status</h5>

              <div className={trackingStyles.rmaTrackingCard}>
                <Steps
                  current={activeExchangeStepIndex}
                  size="small"
                  items={exchangeTrackingSteps.map((step, index) => {
                    const completed =
                      isStepCompleted(step.code) ||
                      (returnRequest.status === 'completed' && step.code === 'exchange_completed');

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
                <>
                  <h6 className="mb-3 mt-3">Map - Leg 1 (Seller to Buyer)</h6>
                  <DeliveryTrackingMap
                    sellerCoords={getTrackingCoordinates().seller}
                    buyerCoords={getTrackingCoordinates().buyer}
                    duration={10}
                    startTime={exchangeLegOneStartTime}
                    syncRoom={returnRequest._id}
                    onDeliveryComplete={() => setExchangeLegOneCompleted(true)}
                  />

                  <div className="mt-3 d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={handleBuyerConfirmHandover}
                      disabled={!canBuyerConfirmExchangeHandover || submitting}
                    >
                      {submitting ? 'Submitting...' : 'I Received Replacement & Handed Faulty Item'}
                    </Button>
                  </div>
                </>
              )}

              {(currentStep === 'shipper_return_to_seller' ||
                currentStep === 'exchange_completed' ||
                returnRequest.status === 'completed' ||
                isStepCompleted('shipper_deliver_and_collect') ||
                isStepCompleted('shipper_return_to_seller')) && (
                <>
                  <h6 className="mb-3 mt-4">Map - Leg 2 (Buyer back to Seller)</h6>
                  <DeliveryTrackingMap
                    sellerCoords={getTrackingCoordinates().buyer}
                    buyerCoords={getTrackingCoordinates().seller}
                    duration={10}
                    startTime={exchangeLegTwoStartTime}
                    syncRoom={returnRequest._id}
                    onDeliveryComplete={() => setExchangeLegTwoCompleted(true)}
                  />
                  {exchangeLegTwoCompleted && returnRequest.status !== 'completed' && (
                    <Alert variant="info" className="mt-3 mb-0">
                      Leg 2 has arrived at seller location. Waiting seller final exchange
                      processing.
                    </Alert>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {isRefundFlow && (
        <Alert variant="info">
          <Alert.Heading>Refund Logistics Flow</Alert.Heading>
          <ol className="mb-0">
            <li>Leg 1: Shipper travels from seller to buyer.</li>
            <li>Buyer confirms they have handed faulty item back.</li>
            <li>Leg 2: Shipper returns faulty item from buyer to seller.</li>
            <li>
              After seller confirms receipt, refund amount is credited to buyer GZCoin wallet.
            </li>
          </ol>
        </Alert>
      )}

      {isRefundFlow && (
        <Card className="mt-3">
          <Card.Body>
            <h5 className="mb-3">Refund Tracking Status</h5>

            <div className={trackingStyles.rmaTrackingCard}>
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

            {(currentStep === 'seller_to_buyer_in_transit' ||
              returnRequest.status === 'approved') &&
              !isStepCompleted('buyer_confirmed_handover') && (
                <>
                  <h6 className="mb-3">Map - Leg 1 (Seller to Buyer)</h6>
                  <DeliveryTrackingMap
                    sellerCoords={getTrackingCoordinates().seller}
                    buyerCoords={getTrackingCoordinates().buyer}
                    duration={10}
                    startTime={refundLegOneStartTime}
                    syncRoom={returnRequest._id}
                    onDeliveryComplete={() => setLegOneCompleted(true)}
                  />

                  <div className="mt-3 d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={handleBuyerConfirmHandover}
                      disabled={!canBuyerConfirmHandover || submitting}
                    >
                      {submitting ? 'Submitting...' : 'I Have Handed Over Faulty Item'}
                    </Button>
                  </div>
                </>
              )}

            {(currentStep === 'buyer_to_seller_in_transit' ||
              isStepCompleted('buyer_to_seller_in_transit') ||
              isStepCompleted('seller_confirmed_faulty_received') ||
              returnRequest.status === 'processing' ||
              returnRequest.status === 'completed') && (
              <>
                <h6 className="mb-3 mt-4">Map - Leg 2 (Buyer back to Seller)</h6>
                <DeliveryTrackingMap
                  sellerCoords={getTrackingCoordinates().buyer}
                  buyerCoords={getTrackingCoordinates().seller}
                  duration={10}
                  startTime={refundLegTwoStartTime}
                  syncRoom={returnRequest._id}
                  onDeliveryComplete={() => setLegTwoCompleted(true)}
                />
                {legTwoCompleted &&
                  !isStepCompleted('seller_confirmed_faulty_received') &&
                  returnRequest.status !== 'completed' && (
                    <Alert variant="info" className="mt-3 mb-0">
                      Shipper has arrived at seller location. Waiting for seller to confirm receipt.
                    </Alert>
                  )}
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default BuyerReturnStatusPage;
