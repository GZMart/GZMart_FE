import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import styles from '@assets/styles/ProfilePage/ProfilePage.module.css';
import Header from '@components/common/Header';
import Footer from '@components/common/Footer';

const ProfilePage = () => {
  const navigate = useNavigate();
  
  // State for tab switching
  const [activeTab, setActiveTab] = useState('account');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsTab, setDetailsTab] = useState('items');

  // Mock user data
  const [formData, setFormData] = useState({
    firstName: 'Sofia',
    lastName: 'Havertz',
    displayName: 'Sofia',
    email: 'sofiahavertz@gmail.com',
    oldPassword: '',
    newPassword: '',
    repeatPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving profile:', formData);
  };

  const handleLogout = () => {
    console.log('Logout');
  };

  const renderAccountTab = () => (
    <>
      <div className={styles.sectionHeader}>
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
         </svg>
         <h3 className={styles.sectionTitle}>Account Details</h3>
      </div>

      <div className={styles.formSection}>
         <div className={styles.formGroup}>
            <label className={styles.formLabel}>FIRST NAME *</label>
            <input 
               type="text" 
               name="firstName" 
               value={formData.firstName} 
               onChange={handleChange}
               className={styles.formInput} 
            />
         </div>
         <div className={styles.formGroup}>
            <label className={styles.formLabel}>LAST NAME *</label>
            <input 
               type="text" 
               name="lastName" 
               value={formData.lastName}
               onChange={handleChange}
               className={styles.formInput} 
            />
         </div>

         <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>DISPLAY NAME *</label>
            <input 
               type="text" 
               name="displayName"
               value={formData.displayName}
               onChange={handleChange}
               className={styles.formInput} 
            />
            <div className={styles.formNote}>This will be how your name will be displayed in the account section and in reviews</div>
         </div>

         <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>EMAIL *</label>
            <input 
               type="email" 
               name="email"
               value={formData.email}
               onChange={handleChange}
               className={styles.formInput} 
            />
         </div>
      </div>

      <div className={styles.sectionHeader}>
         <h3 className={styles.sectionTitle}>Password</h3>
      </div>

      <div className={styles.formSection}>
         <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>OLD PASSWORD</label>
            <input 
               type="password" 
               name="oldPassword"
               value={formData.oldPassword}
               onChange={handleChange}
               placeholder="Old password"
               className={styles.formInput} 
            />
         </div>
         <div className={styles.formGroup}>
            <label className={styles.formLabel}>NEW PASSWORD</label>
            <input 
               type="password" 
               name="newPassword"
               value={formData.newPassword}
               onChange={handleChange}
               placeholder="New password"
               className={styles.formInput} 
            />
         </div>
         <div className={styles.formGroup}>
            <label className={styles.formLabel}>REPEAT NEW PASSWORD</label>
            <input 
               type="password" 
               name="repeatPassword"
               value={formData.repeatPassword}
               onChange={handleChange}
               placeholder="Repeat new password"
               className={styles.formInput} 
            />
         </div>
      </div>

      <div className={styles.formGroup}>
         <button className={styles.saveButton} onClick={handleSave}>
            Save changes
         </button>
      </div>
    </>
  );

  const renderAddressTab = () => (
    <div>
      <div className={styles.addressHeader}>
         <h3 className={styles.addressTitle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
               <circle cx="12" cy="10" r="3"/>
               <img src="https://cdn-icons-png.flaticon.com/512/854/854878.png" style={{ display: 'none' }} alt="map" />
            </svg>
            Address
         </h3>
         <button className={styles.addAddressBtn}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <line x1="12" y1="5" x2="12" y2="19"/>
               <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
         </button>
      </div>

      <div className={styles.addressGrid}>
         {[1, 2, 3, 4].map((item) => (
            <div key={item} className={styles.addressCard}>
               <div className={styles.cardHeader}>
                  <span className={styles.cardType}>{item % 2 !== 0 ? 'Billing Address' : 'Shipping Address'}</span>
                  <span className={styles.editLink}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                     </svg>
                     Edit
                  </span>
               </div>
               <div className={styles.cardBody}>
                  <span className={styles.cardName}>Sofia Havertz</span>
                  <p style={{ margin: '0.5rem 0 0', lineHeight: '1.6'}}>
                     (+1) 234 567 890<br/>
                     345 Long Island, NewYork, United States
                  </p>
               </div>
            </div>
         ))}
      </div>
      <button className={styles.saveAddressBtn}>Save address</button>
    </div>
  );

  const renderOrdersTab = () => (
    <div>
      {!selectedOrder ? (
         <>
            <div className={styles.addressHeader}>
               <h3 className={styles.addressTitle}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFB84D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M21 8h-4l-3-4-3 4H7L4 8l-3 4v8h22v-8l-3-4z"/>
                     <circle cx="12" cy="13" r="3" fill="#3B82F6" stroke="none" />
                     <path d="M20 20l-2-2m-2 2l2-2" stroke="white" strokeWidth="1"/>
                  </svg>
                  Orders History
               </h3>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.orderTable}>
                   <thead>
                      <tr className={styles.orderTableHeader}>
                         <th>Number ID</th>
                         <th>Dates</th>
                         <th>Status</th>
                         <th>Price</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr className={styles.orderRow} onClick={() => setSelectedOrder({ id: '#3456_768', date: 'October 17, 2023', total: '$1234.00' })} style={{ cursor: 'pointer' }}>
                         <td>#3456_768</td>
                         <td>October 17, 2023</td>
                         <td><span className={styles.orderStatus}>Delivered</span></td>
                         <td>$1234.00</td>
                      </tr>
                      <tr className={styles.orderRow} onClick={() => setSelectedOrder({ id: '#3456_980', date: 'October 11, 2023', total: '$345.00' })} style={{ cursor: 'pointer' }}>
                         <td>#3456_980</td>
                         <td>October 11, 2023</td>
                         <td><span className={styles.orderStatus}>Delivered</span></td>
                         <td>$345.00</td>
                      </tr>
                      <tr className={styles.orderRow} onClick={() => setSelectedOrder({ id: '#3456_120', date: 'August 24, 2023', total: '$2345.00' })} style={{ cursor: 'pointer' }}>
                         <td>#3456_120</td>
                         <td>August 24, 2023</td>
                         <td><span className={styles.orderStatus}>Delivered</span></td>
                         <td>$2345.00</td>
                      </tr>
                      <tr className={styles.orderRow} onClick={() => setSelectedOrder({ id: '#3456_030', date: 'August 12, 2023', total: '$845.00' })} style={{ cursor: 'pointer' }}>
                         <td>#3456_030</td>
                         <td>August 12, 2023</td>
                         <td><span className={styles.orderStatus}>Delivered</span></td>
                         <td>$845.00</td>
                      </tr>
                   </tbody>
                </table>
            </div>

            <button className={styles.enquireButton}>What to enquire about your order ?</button>
         </>
      ) : (
         <div>
            {/* Details Tabs */}
            <div className={styles.detailsTabs}>
               <button 
                  className={`${styles.detailsTabBtn} ${detailsTab === 'items' ? styles.active : ''}`}
                  onClick={() => setDetailsTab('items')}
               >
                  Items Ordered
               </button>
               <button 
                  className={`${styles.detailsTabBtn} ${detailsTab === 'invoices' ? styles.active : ''}`}
                  onClick={() => setDetailsTab('invoices')}
               >
                  Invoices
               </button>
               <button 
                  className={`${styles.detailsTabBtn} ${detailsTab === 'shipment' ? styles.active : ''}`}
                  onClick={() => setDetailsTab('shipment')}
               >
                  Order Shipment
               </button>
            </div>

            {/* Product Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.productTable}>
                   <thead>
                      <tr>
                         <th>Product Name</th>
                         <th>Price</th>
                         <th>Qty</th>
                         <th>Subtotal</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td>
                            <div className={styles.productItem}>
                               <img src="https://images.unsplash.com/photo-1551028919-ac66c5f8b63b?w=100&q=80" alt="Jacket" className={styles.productImage} />
                               <div className={styles.productInfo}>
                                  <h4>Jacket</h4>
                                  <p>COAT</p>
                               </div>
                            </div>
                         </td>
                         <td>$54.69</td>
                         <td>2</td>
                         <td>$109.38</td>
                      </tr>
                   </tbody>
                </table>
            </div>

            {/* Order Information */}
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '3rem', marginBottom: '1rem' }}>Order Information</h3>
            
            <div className={styles.orderInfoGrid}>
               <div className={styles.infoSection}>
                  <h4>Order Details</h4>
                  <div className={styles.infoRow}>
                     <span className={styles.infoLabel}>Sub Total</span>
                     <span className={styles.infoValue}>$119.69</span>
                  </div>
                  <div className={styles.infoRow}>
                     <span className={styles.infoLabel}>Discount</span>
                     <span className={styles.infoValue}>-$13.40</span>
                  </div>
                  <div className={styles.infoRow}>
                     <span className={styles.infoLabel}>Delivery Fee</span>
                     <span className={styles.infoValue}>-$0.00</span>
                  </div>
                  <div className={styles.infoRow} style={{ marginTop: '1rem' }}>
                     <span className={styles.infoLabel} style={{ fontWeight: '700', color: '#1a1a1a' }}>Grand Total</span>
                     <span className={styles.infoValue} style={{ fontSize: '1.1rem' }}>$106.29</span>
                  </div>
               </div>

               <div className={styles.infoSection}>
                  <h4>Payment Details</h4>
                  <div className={styles.infoRow}>
                     <span className={styles.infoValue}>Cash on Delivery</span>
                  </div>
               </div>

               <div className={styles.infoSection}>
                  <h4>Address Details</h4>
                  <div className={styles.addressDetails}>
                     <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Vincent Lobo</p>
                     <p>3068 Woodlawn Drive</p>
                     <p>Milwaukee</p>
                     <p># 3456_768</p>
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
               <button className={styles.reorderBtn}>Reorder</button>
               <button className={styles.ratingBtn}>Add Rating</button>
            </div>
         </div>
      )}
    </div>
  );

  return (
    <div className={styles.pageLayout}>
      <Header />

      {/* Breadcrumb Area */}
      <div className={styles.breadcrumbNav}>
        <Container>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
             <Link to="/" className={styles.breadcrumbLink} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                 <polyline points="9 22 9 12 15 12 15 22"/>
               </svg>
               HOME
             </Link>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
             </svg>
             <span style={{color: '#3B82F6'}}>My Profile</span>
           </div>
        </Container>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.profileContainer}>
          {/* Mobile Navigation Bar */}
          <div className={styles.navigationBar}>
            {/* Back Button */}
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              <div className={styles.backIconCircle}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Back</span>
            </button>

            <h1 className={styles.pageTitle}>MY PROFILE</h1>

            {/* Share Button */}
            <button className={styles.shareButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>

          <div className={styles.profileGrid}>
            {/* Sidebar Card */}
            <div className={styles.sidebarCard}>
               <div className={styles.avatarSection}>
                  <img src="https://i.pravatar.cc/300?img=11" alt="Profile" className={styles.avatar} />
                  <div className={styles.cameraButton}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                     </svg>
                  </div>
               </div>
               <h2 className={styles.userName}>Suprava Saha</h2>
               
               <div className={styles.sidebarNavGrid}>
                  <div className={`${styles.navCard} ${styles.navCardAccount} ${activeTab === 'account' ? styles.active : ''}`} onClick={() => setActiveTab('account')}>
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                     </svg>
                     <span className={styles.navCardTitle}>MY ACCOUNT</span>
                  </div>
                  
                  <div className={`${styles.navCard} ${styles.navCardOrder} ${activeTab === 'orders' ? styles.active : ''}`} onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}>
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 8h-4l-3-4-3 4H7L4 8l-3 4v8h22v-8l-3-4z"/>
                        <path d="M10 12h4"/>
                     </svg>
                     <span className={styles.navCardTitle}>ORDER HISTORY</span>
                  </div>

                  <div className={`${styles.navCard} ${styles.navCardAddress} ${activeTab === 'address' ? styles.active : ''}`} onClick={() => setActiveTab('address')}>
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5"/>
                     </svg>
                     <span className={styles.navCardTitle}>ADDRESS</span>
                  </div>

                  <div className={`${styles.navCard} ${styles.navCardLogout}`} onClick={handleLogout}>
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                     </svg>
                     <span className={styles.navCardTitle}>LOGOUT</span>
                  </div>
               </div>
            </div>

            {/* Main Content Area */}
            <div className={styles.accountDetailsCard}>
               {activeTab === 'account' && renderAccountTab()}
               {activeTab === 'address' && renderAddressTab()}
               {activeTab === 'orders' && renderOrdersTab()}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
