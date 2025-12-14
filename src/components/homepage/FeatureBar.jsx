import React from 'react';
import { Package, Trophy, CreditCard, Headphones } from 'lucide-react';

const FeatureBar = () => {
  const features = [
    {
      id: 1,
      icon: Package,
      title: 'FASTED DELIVERY',
      subtitle: 'Delivery in 24/H',
    },
    {
      id: 2,
      icon: Trophy,
      title: '24 HOURS RETURN',
      subtitle: '100% money-back guarantee',
    },
    {
      id: 3,
      icon: CreditCard,
      title: 'SECURE PAYMENT',
      subtitle: 'Your money is safe',
    },
    {
      id: 4,
      icon: Headphones,
      title: 'SUPPORT 24/7',
      subtitle: 'Live contact/message',
    },
  ];

  return (
    <div className="container py-4">
      <div className="border rounded p-4 bg-white">
        <div className="row g-4">
          {features.map((item, index) => (
            <div key={item.id} className="col-lg-3 col-md-6">
              <div className="d-flex align-items-center justify-content-lg-center gap-3 h-100 position-relative">
                {/* Icon */}
                <item.icon size={32} strokeWidth={1.5} className="text-dark" />

                {/* Text */}
                <div>
                  <h6 className="mb-0 text-dark" style={{ fontSize: '0.85rem' }}>
                    {item.title}
                  </h6>
                  <small className="text-secondary" style={{ fontSize: '0.85rem' }}>
                    {item.subtitle}
                  </small>
                </div>

                {/* Vertical Divider (Only visible on Large screens, not on last item) */}
                {index !== features.length - 1 && (
                  <div
                    className="d-none d-lg-block position-absolute"
                    style={{
                      right: '-12px', // Pulls divider to the gap between columns
                      top: '10%',
                      bottom: '10%',
                      width: '1px',
                      backgroundColor: '#E5E7EB',
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureBar;
