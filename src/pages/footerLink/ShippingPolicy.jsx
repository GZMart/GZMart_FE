import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';

// --- DATA CONFIGURATION ---
const shippingData = [
  {
    title: '', // Empty title handled gracefully
    content: [
      'All orders are processed within 2 to 3 days and are delivered within 3 to 7 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.',
    ],
  },
  {
    title: 'Domestic Shipping Rates and Estimates',
    content: [
      'For calculated shipping rates: Shipping charges for your order will be calculated and displayed at checkout.',
    ],
  },
  {
    title: 'In-store pickup',
    content: ['We do not offer in-store pickups'],
  },
  {
    title: 'International Shipping',
    content: [
      'We only sell in India (Domestic).',
      'How do I check the status of my order?',
      'When your order has shipped, you will receive an email notification from us which will include a tracking number you can use to check its status. Please allow 48 hours for the tracking information to become available.',
      // Logic đặc biệt: Đoạn này chứa email và địa chỉ, tách ra để hiển thị tốt hơn trong JSX nếu cần,
      // hoặc giữ nguyên text string. Ở đây tôi giữ text nhưng sẽ highlight email ở phần render.
      `If you haven't received your order within 12 days of receiving your shipping confirmation email, please contact us at united deals.contact@gmail.com with your name and order number, and we will look into it for you.`,
      `Address: A-3/B, S.G. Towers, Bhiringi Mondal Para, Benachity, Durgapur, Paschim Bardhaman, West Bengal, India-713213.`,
    ],
  },
];

const ShippingPolicy = () => {
  const navigate = useNavigate();

  return (
    // 'container' giúp căn giữa, 'py-5' tạo khoảng cách trên dưới
    <div className="container py-4 py-md-5">
      {/* --- HEADER --- */}
      {/* px-3: tạo lề nhỏ trên mobile, mx-md-4: lề rộng hơn trên desktop */}
      <div className="d-flex align-items-center justify-content-between mb-4 mx-md-4 px-3 px-md-0">
        <div
          className="d-flex align-items-center gap-3 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <div
            className="border rounded-circle d-flex align-items-center justify-content-center bg-white shadow-sm"
            style={{ width: '40px', height: '40px', borderColor: '#E5E7EB' }}
          >
            <ChevronLeft size={22} className="text-dark" />
          </div>
          <span className="fw-bold text-dark fs-5">Back</span>
        </div>

        <button className="btn border-0 p-0 hover-opacity">
          <Share2 size={22} className="text-dark" />
        </button>
      </div>

      {/* --- CONTENT --- */}
      <div className="mx-md-4 px-3 px-md-0">
        {/* Responsive Heading: fs-1 trên mobile, display-4 trên desktop */}
        <h1 className="fs-1 display-md-4 fw-bolder mb-4 text-dark">Shipping Policy</h1>

        <div className="text-secondary" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
          {shippingData.map((section, index) => (
            <div key={index} className="mb-4">
              {/* Chỉ render Title nếu có nội dung */}
              {section.title && (
                <h6 className="text-uppercase fw-bold text-dark mb-2">{section.title}</h6>
              )}

              {/* Render từng đoạn văn */}
              {section.content.map((paragraph, pIndex) => (
                <p key={pIndex} className="mb-2">
                  {/* Hàm nhỏ để tự động biến email thành link clickable */}
                  {paragraph.split(' ').map((word, wIdx) => {
                    if (word.includes('@')) {
                      return (
                        <span key={wIdx}>
                          <a
                            href={`mailto:${word}`}
                            className="text-dark fw-bold text-decoration-underline"
                          >
                            {word}
                          </a>{' '}
                        </span>
                      );
                    }
                    return word + ' ';
                  })}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
