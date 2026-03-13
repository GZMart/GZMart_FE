import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';

const refundData = [
  {
    title: 'Return Policy',
    content: [
      'We have a 30-day return policy, which means you have 30 days after receiving your item to request a return.',
      'To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase.',
      'To start a return, you can contact us at united deals.contact@gmail.com.',
      'If your return is accepted, we’ll send you a return shipping label, as well as instructions on how and where to send your package. Items sent back to us without first requesting a return will not be accepted.',
      'You can always contact us for any return question at united deals.contact@gmail.com.',
    ],
  },
  {
    title: 'Damages and issues',
    content: [
      'Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right.',
    ],
  },
  {
    title: 'Exceptions / non-returnable items',
    content: [
      'Certain types of items cannot be returned, like perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products). We also do not accept returns for hazardous materials, flammable liquids, or gases. Please get in touch if you have questions or concerns about your specific item.',
      'Unfortunately, we cannot accept returns on sale items or gift cards.',
    ],
  },
  {
    title: 'Exchanges',
    content: [
      'The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.',
    ],
  },
  {
    title: 'European Union 14 day cooling off period',
    content: [
      'Notwithstanding the above, if the merchandise is being shipped into the European Union, you have the right to cancel or return your order within 14 days, for any reason and without a justification. As above, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase.',
    ],
  },
  {
    title: 'Refunds',
    content: [
      'We will notify you once we’ve received and inspected your return, and let you know if the refund was approved or not. If approved, you’ll be automatically refunded on your original payment method within 10 business days. Please remember it can take some time for your bank or credit card company to process and post the refund too.',
      'If more than 15 business days have passed since we’ve approved your return, please contact us at united deals.contact@gmail.com.',
    ],
  },
];

const renderTextWithLinks = (text) =>
  text.split(' ').map((word, index) => {
    if (word.includes('@')) {
      const cleanWord = word.replace(/[.,]$/, '');
      return (
        <span key={index}>
          <a href={`mailto:${cleanWord}`} className="text-dark fw-bold text-decoration-underline">
            {word}
          </a>{' '}
        </span>
      );
    }
    return `${word} `;
  });

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-4 py-md-5">
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

        <button className="btn border-0 p-0">
          <Share2 size={22} className="text-dark" />
        </button>
      </div>

      <div className="pb-5 mx-md-4 px-3 px-md-0">
        <h1 className="fs-1 display-md-4 fw-bolder mb-4 text-dark">Refund Policy</h1>

        <div className="text-secondary" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
          {refundData.map((section, index) => (
            <div key={index} className="mb-5">
              <h6 className="text-uppercase fw-bold text-dark mb-3">{section.title}</h6>
              {section.content.map((paragraph, pIndex) => (
                <p key={pIndex} className="mb-3">
                  {renderTextWithLinks(paragraph)}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
