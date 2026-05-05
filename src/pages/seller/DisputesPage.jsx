import DisputeCenter from '@components/common/disputes/DisputeCenter';

const DisputesPage = () => (
  <div
    style={{
      padding: '1.75rem 1.75rem 2.5rem',
      maxWidth: '1600px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#f1f5f9',
    }}
  >
    <DisputeCenter mode="seller" />
  </div>
);

export default DisputesPage;
