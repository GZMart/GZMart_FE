import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types'; // <-- Thêm thư viện khai báo prop types
import {
  ChevronLeft,
  Search,
  Share2,
  Truck,
  Layers,
  Lock,
  FileText,
  CreditCard,
  Wallet,
  User,
  Store,
  PhoneCall,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

// --- Data Constants ---
const HELP_TOPICS = [
  { id: 1, label: 'Track Order', icon: Truck, active: true },
  { id: 2, label: 'Wishlist & Compare', icon: Layers, active: false },
  { id: 3, label: 'Reset Password', icon: Lock, active: false },
  { id: 4, label: 'Shipping & Billing', icon: FileText, active: false },
  { id: 5, label: 'Payment Option', icon: CreditCard, active: false },
  { id: 6, label: 'Shopping Cart & Wallet', icon: Wallet, active: false },
  { id: 7, label: 'User & Account', icon: User, active: false },
  { id: 8, label: 'Sell on Clicon', icon: Store, active: false },
];

const POPULAR_TOPICS = [
  [
    { text: 'How do I return my item?' },
    { text: 'What is Clicons Returns Policy?', highlight: true },
    { text: 'How long is the refund process?' },
  ],
  [
    { text: "What are the 'Delivery Timelines'?" },
    { text: "What is 'Discover Your Daraz Campaign 2022'?" },
    { text: 'What is the Voucher & Gift Offer in this Campaign?' },
  ],
  [
    { text: 'How to cancel Clicon Order.' },
    { text: 'Ask the Digital and Device Community' },
    { text: 'How to change my shop name?' },
  ],
];

// --- Sub-Components ---

const TopicCard = ({ item }) => (
  <motion.div
    whileHover={{ scale: 1.02, backgroundColor: '#F9FAFB' }}
    whileTap={{ scale: 0.98 }}
    className={`d-flex align-items-center gap-3 p-3 rounded border cursor-pointer h-100 ${
      item.active ? 'bg-white border-primary' : 'bg-white border-light'
    }`}
    style={{
      borderWidth: item.active ? '2px' : '1px',
      borderColor: item.active ? '#1B75F3' : '#E5E7EB',
      transition: 'border-color 0.2s',
    }}
  >
    <item.icon size={24} className={item.active ? 'text-primary' : 'text-dark'} />
    <span className={`fw-medium ${item.active ? 'text-dark' : 'text-secondary'}`}>
      {item.label}
    </span>
  </motion.div>
);

// Khai báo Prop Types cho TopicCard
TopicCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    active: PropTypes.bool.isRequired,
  }).isRequired,
};

const ContactCard = ({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  desc,
  contact,
  btnText,
  btnColor,
  btnClass,
}) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white p-4 rounded-3 shadow-sm h-100 d-flex gap-3 text-start align-items-start"
  >
    <div
      className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: '60px', height: '60px', backgroundColor: iconBg }}
    >
      <Icon size={28} style={{ color: iconColor }} />
    </div>
    <div className="flex-grow-1">
      <h5 className="fw-bold text-dark">{title}</h5>
      <p className="text-secondary small mb-2">{desc}</p>
      <h5 className="fw-bold text-dark mb-3">{contact}</h5>
      <button
        className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2 text-white ${btnClass}`}
        style={{ backgroundColor: btnColor, borderColor: btnColor }}
      >
        {btnText} <ArrowRight size={16} />
      </button>
    </div>
  </motion.div>
);

// Khai báo Prop Types cho ContactCard
ContactCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  iconColor: PropTypes.string.isRequired,
  iconBg: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  contact: PropTypes.string.isRequired,
  btnText: PropTypes.string.isRequired,
  btnColor: PropTypes.string.isRequired,
  btnClass: PropTypes.string.isRequired,
};

const TopicList = ({ items }) => (
  <ul className="list-unstyled d-flex flex-column gap-3 text-secondary">
    {items.map((t, idx) => (
      <li key={idx} className="d-flex gap-2" style={t.highlight ? { color: '#FA8232' } : {}}>
        <span>•</span> <span className={t.highlight ? 'fw-medium' : ''}>{t.text}</span>
      </li>
    ))}
  </ul>
);

// Khai báo Prop Types cho TopicList
TopicList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      highlight: PropTypes.bool,
    })
  ).isRequired,
};

// --- Main Component ---

const HelpCenter = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Search & Navigation Section */}
      <div className="container pt-4 mb-5">
        <div className="d-flex align-items-center justify-content-between mx-md-5 px-3 px-md-0 mb-4">
          <motion.div
            whileHover={{ x: -3 }}
            className="d-flex align-items-center gap-3"
            onClick={() => navigate(-1)}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="border rounded-circle d-flex align-items-center justify-content-center bg-white shadow-sm"
              style={{ width: '40px', height: '40px' }}
            >
              <ChevronLeft size={22} className="text-dark" />
            </div>
            <span className="fw-bold text-dark fs-5">Back</span>
          </motion.div>
          <button className="btn border-0 p-0 hover-opacity">
            <Share2 size={22} className="text-dark" />
          </button>
        </div>

        <div className="row g-5 align-items-center mx-md-4 px-3 px-md-0">
          <motion.div
            className="col-lg-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1 variants={itemVariants} className="display-5 fw-bolder text-dark mb-4">
              How can we help you?
            </motion.h1>

            <motion.div
              variants={itemVariants}
              className="input-group mb-5 shadow-sm rounded-pill overflow-hidden bg-white border"
            >
              <span className="input-group-text bg-white border-0 ps-4">
                <Search size={20} className="text-secondary" />
              </span>
              <input
                type="text"
                className="form-control border-0 py-3 text-secondary"
                placeholder="Enter your question or keyword"
                style={{ outline: 'none', boxShadow: 'none' }}
              />
              <button className="btn btn-primary px-4 fw-bold m-1 rounded-pill bg-primary border-primary">
                SEARCH
              </button>
            </motion.div>

            <motion.div variants={containerVariants} className="row g-3">
              {HELP_TOPICS.map((item) => (
                <motion.div variants={itemVariants} key={item.id} className="col-md-6 col-12">
                  <TopicCard item={item} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-lg-6 d-none d-lg-block text-center"
          >
            <img
              src="/howwecan.png"
              alt="Support Agent"
              className="img-fluid"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
          </motion.div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-5" style={{ backgroundColor: '#F2F4F5' }}>
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge bg-primary px-3 py-2 mb-3 rounded-pill">CONTACT US</span>
            <h2 className="fw-bolder mb-5 text-dark">
              Don’t find your answer? <br /> Contact us.
            </h2>
          </motion.div>

          <div className="row g-4 justify-content-center px-3">
            <div className="col-md-6 col-lg-5">
              <ContactCard
                icon={PhoneCall}
                iconColor="#1B75F3"
                iconBg="#EAF4FE"
                title="Call us now"
                desc="We are available online from 9:00 AM to 5:00 PM (GMT95:45). Talk with us now."
                contact="+1-202-555-0126"
                btnText="CALL NOW"
                btnColor="#1B75F3"
                btnClass="btn-primary"
              />
            </div>
            <div className="col-md-6 col-lg-5">
              <ContactCard
                icon={MessageSquare}
                iconColor="#2DB224"
                iconBg="#EAF7E9"
                title="Chat with us"
                desc="We are available online from 9:00 AM to 5:00 PM (GMT95:45). Talk with us now."
                contact="Support@clicon.com"
                btnText="CONTACT US"
                btnColor="#2DB224"
                btnClass="btn-success"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Popular Topics Section */}
      <div className="py-5">
        <div className="container">
          <h4 className="fw-bolder text-center text-dark mb-5">Popular Topics</h4>
          <div className="row justify-content-center g-4 mx-md-4 px-3 px-md-0">
            {POPULAR_TOPICS.map((columnItems, idx) => (
              <div key={idx} className="col-lg-4 col-md-6">
                <TopicList items={columnItems} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
