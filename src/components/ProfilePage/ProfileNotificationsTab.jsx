import { Bell } from 'lucide-react';
import styles from '@assets/styles/ProfilePage/ProfilePage.module.css';

const ProfileNotificationsTab = () => (
  <div>
    <div className={styles.sectionHeader}>
      <Bell size={24} color="#111827" strokeWidth={2} />
      <h3 className={styles.sectionTitle}>Notifications</h3>
    </div>
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6B7280' }}>
      <Bell size={64} color="#D1D5DB" strokeWidth={1.5} style={{ margin: '0 auto 1rem' }} />
      <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>No Notifications</h4>
      <p>You don&apos;t have any notifications yet.</p>
    </div>
  </div>
);

export default ProfileNotificationsTab;
