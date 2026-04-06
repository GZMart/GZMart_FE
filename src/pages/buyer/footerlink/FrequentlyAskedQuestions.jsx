import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Plus, Minus } from 'lucide-react';

const faqData = [
  {
    id: 1,
    question: 'The expense windows adapted sir. Wrong widen drawn.',
    answer:
      'Offending belonging promotion provision an be oh consulted ourselves it. Blessing welcomed ladyship she met humoured sir breeding her.',
  },
  {
    id: 2,
    question: 'Six curiosity day assurance bed necessary?',
    answer:
      'Agreed but expect repair she nay sir silent person. Direction can dependent one bed situation attempted. His she are man their despite believe.',
  },
  {
    id: 3,
    question: 'Produce say the ten moments parties?',
    answer:
      'Provision an be oh consulted ourselves it. Blessing welcomed ladyship she met humoured sir breeding her. Six curiosity day assurance bed necessary.',
  },
  {
    id: 4,
    question: 'Simple innate summer fat appear basket his desire joy?',
    answer:
      'Whatever land she broad say here fail. Talked, high, shy, shame, maybe. Innate summer fat appear basket his desire joy. Simple innate summer fat appear basket his desire joy.',
  },
  {
    id: 5,
    question: 'Outward clothes promise at gravity do excited?',
    answer:
      'Gravity do excited. Outward clothes promise at gravity do excited. Simple innate summer fat appear basket his desire joy.',
  },
];

const FaqPage = () => {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(1);

  const handleToggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="container">
      <div className="d-flex align-items-center justify-content-between mb-5 mx-md-4 px-3 px-md-0">
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

      <div className="mx-md-4 px-3 px-md-0">
        <div className="row g-5">
          <div className="col-lg-5 col-12 d-flex flex-column">
            <h1 className="display-4 fw-bolder text-dark mb-3">
              Frequently <br /> Asked Questions
            </h1>
            <p className="text-secondary fs-5 mb-4">Let’s create your account</p>

            <div className="mb-5">
              <button
                className="btn btn-primary btn-lg rounded-3 fw-medium px-4 py-2 border-0"
                style={{ backgroundColor: '#1B75F3' }}
                onClick={() => navigate('/contact')}
              >
                Need Help Contact Us
              </button>
            </div>

            <div className="mt-auto">
              <img
                src="/faq.png"
                alt="FAQ Illustration"
                className="img-fluid"
                style={{ maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>

          <div className="col-lg-7 col-12">
            <div className="d-flex flex-column gap-3">
              {faqData.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`border rounded-3 p-3 transition-all ${
                      isOpen ? 'bg-white shadow-sm' : 'bg-white'
                    }`}
                    style={{ borderColor: '#E5E7EB', cursor: 'pointer' }}
                    onClick={() => handleToggle(item.id)}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <h6
                        className={`fw-bold mb-0 ${isOpen ? 'text-primary' : 'text-dark'}`}
                        style={{ lineHeight: '1.4', paddingRight: '10px' }}
                      >
                        {item.question}
                      </h6>
                      <div className="text-dark">
                        {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                      </div>
                    </div>

                    {isOpen && (
                      <div
                        className="mt-3 text-secondary"
                        style={{ fontSize: '0.95rem', lineHeight: '1.6' }}
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
