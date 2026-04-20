import { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Modal,
  Popconfirm,
  Checkbox,
} from 'antd';
import coinService from '@services/api/coin.service';
import styles from '@assets/styles/admin/AdminCoinToolsPage.module.css';

const AdminCoinToolsPage = () => {
  const [grantForm] = Form.useForm();
  const [loadingGrant, setLoadingGrant] = useState(false);
  const [loadingJob, setLoadingJob] = useState(null);
  const [notifyDays, setNotifyDays] = useState(3);
  const [expireOpen, setExpireOpen] = useState(false);
  const [expireAck, setExpireAck] = useState(false);

  const executeGrant = async (values) => {
    try {
      setLoadingGrant(true);
      const res = await coinService.adminGrant({
        userEmail: String(values.userEmail).trim().toLowerCase(),
        amount: values.amount,
        description: values.description,
      });
      const bal = res?.data?.balance;
      const baseMsg = res?.message || 'GZCoin granted';
      const extra =
        bal && typeof bal.after === 'number'
          ? ` Balance after grant: ${bal.after.toLocaleString('en-US')} GZCoin.`
          : '';
      message.success(`${baseMsg}${extra}`);
      grantForm.resetFields();
    } catch (e) {
      console.error(e);
      message.error(e.response?.data?.message || 'Failed to grant GZCoin');
      throw e;
    } finally {
      setLoadingGrant(false);
    }
  };

  const onGrantFormFinish = (values) => {
    const email = String(values.userEmail).trim().toLowerCase();
    Modal.confirm({
      title: 'Confirm GZCoin grant',
      width: 440,
      okText: 'Confirm grant',
      cancelText: 'Cancel',
      content: (
        <ul className={styles.modalList}>
          <li>
            <strong>Email:</strong> {email}
          </li>
          <li>
            <strong>GZCoin amount:</strong>{' '}
            {values.amount?.toLocaleString?.('en-US') ?? values.amount}
          </li>
          <li>
            <strong>Description:</strong> {values.description}
          </li>
        </ul>
      ),
      onOk: () => executeGrant({ ...values, userEmail: email }),
    });
  };

  const runJob = async (key, fn) => {
    try {
      setLoadingJob(key);
      const res = await fn();
      message.success(res?.message || 'Success');
    } catch (e) {
      console.error(e);
      message.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoadingJob(null);
    }
  };

  const runExpireFromModal = async () => {
    try {
      setLoadingJob('expire');
      const res = await coinService.adminExpire();
      message.success(res?.message || 'Expiry batch job started');
      setExpireOpen(false);
      setExpireAck(false);
    } catch (e) {
      console.error(e);
      message.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoadingJob(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.headerBlock}>
        <div className={styles.kicker}>
          <span className={`material-symbols-outlined ${styles.kickerIcon}`}>generating_tokens</span>
          <span className={styles.kickerText}>Platform-wide GZCoin operations</span>
        </div>
        <h1 className={styles.title}>GZCoin tools</h1>
        <p className={styles.subtitle}>
          Grant GZCoin by email and run balance sync, expiry notifications, and batch expiry jobs — for
          internal use only; every action should be auditable.
        </p>
        <p className={styles.warnLine}>
          Double-check email and amounts before confirming. Batch jobs may take time and server resources.
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="coin-grant-heading">
          <div className={styles.cardGlow} aria-hidden />
          <div className={styles.cardInner}>
            <h2 id="coin-grant-heading" className={styles.sectionTitle}>
              <span className={`${styles.badgeNum} ${styles.badgePrimary}`}>1</span>
              Grant GZCoin to a user
            </h2>
            <Form
              form={grantForm}
              className={styles.form}
              layout="vertical"
              requiredMark={false}
              onFinish={onGrantFormFinish}
            >
              <Form.Item
                name="userEmail"
                label="Recipient email"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'email', message: 'Invalid email' },
                ]}
              >
                <Input placeholder="User email…" autoComplete="off" />
              </Form.Item>
              <Form.Item label="GZCoin amount" required>
                <div className={styles.coinInputWrap}>
                  <span className={styles.coinPrefix}>GZ</span>
                  <Form.Item
                    name="amount"
                    noStyle
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <InputNumber
                      className={styles.coinInput}
                      min={1}
                      precision={0}
                      placeholder="0"
                      controls={false}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
              <Form.Item
                name="description"
                label="Description / reason"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.TextArea rows={3} placeholder="Reason for this grant…" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className={styles.submitBtn}
                  loading={loadingGrant}
                >
                  <span className={`material-symbols-outlined ${styles.submitIcon}`}>send</span>
                  Grant GZCoin
                </Button>
              </Form.Item>
            </Form>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="coin-jobs-heading">
          <div className={styles.cardInner}>
            <h2 id="coin-jobs-heading" className={styles.sectionTitle}>
              <span className={`${styles.badgeNum} ${styles.badgeSecondary}`}>2</span>
              Bulk system jobs
            </h2>

            <div className={styles.jobsStack}>
              <div className={styles.jobRow}>
                <div className={styles.jobRowHeader}>
                  <div>
                    <h3 className={styles.jobTitle}>
                      <span className={`material-symbols-outlined ${styles.jobIcon}`}>sync</span>
                      Sync balances
                    </h3>
                    <p className={styles.jobDesc}>
                      Reconcile user wallet balances with recent transactions (server job; may run for a
                      while).
                    </p>
                  </div>
                  <Popconfirm
                    title="Run balance sync?"
                    description="Runtime depends on the number of wallets."
                    okText="Run sync"
                    cancelText="Cancel"
                    onConfirm={() => runJob('sync', () => coinService.adminSync())}
                  >
                    <Button className={styles.actionGhost} loading={loadingJob === 'sync'} type="button">
                      Run sync
                    </Button>
                  </Popconfirm>
                </div>
              </div>

              <div className={styles.jobRow}>
                <h3 className={`${styles.jobTitle} ${styles.jobTitleNotify}`}>
                  <span className={`material-symbols-outlined ${styles.jobIcon}`}>campaign</span>
                  Expiry notifications
                </h3>
                <div className={styles.notifyRow}>
                  <div className={styles.daysField}>
                    <InputNumber
                      className={styles.daysInput}
                      min={1}
                      max={90}
                      value={notifyDays}
                      onChange={(v) => setNotifyDays(v != null && Number(v) > 0 ? Number(v) : 1)}
                      controls={false}
                    />
                    <span className={styles.daysSuffix}>days</span>
                  </div>
                  <div className={styles.notifyBtnWrap}>
                    <Popconfirm
                      title="Send expiry notifications?"
                      description={`Notify users whose GZCoin expires within the next ${notifyDays} days (per backend rules).`}
                      okText="Send notifications"
                      cancelText="Cancel"
                      onConfirm={() =>
                        runJob('notify', () => coinService.adminNotifyExpiring(notifyDays))
                      }
                    >
                      <Button
                        className={styles.actionGhost}
                        loading={loadingJob === 'notify'}
                        type="button"
                      >
                        Send notifications
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>

              <div className={styles.dangerZone}>
                <div>
                  <h3 className={styles.dangerTitle}>
                    <span className={`material-symbols-outlined ${styles.dangerIcon}`}>warning</span>
                    Bulk GZCoin expiry
                  </h3>
                  <p className={styles.dangerKicker}>Danger zone</p>
                  <p className={styles.dangerDesc}>
                    Applies system expiry rules and may reduce user balances. This cannot be easily undone
                    from this UI.
                  </p>
                  <div className={styles.dangerFooter}>
                    <Button
                      danger
                      type="primary"
                      className={styles.dangerBtn}
                      loading={loadingJob === 'expire'}
                      onClick={() => {
                        setExpireAck(false);
                        setExpireOpen(true);
                      }}
                    >
                      Run expiry now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Modal
        title="Confirm bulk GZCoin expiry"
        open={expireOpen}
        onCancel={() => {
          setExpireOpen(false);
          setExpireAck(false);
        }}
        okText="Run expiry job"
        okType="danger"
        cancelText="Cancel"
        okButtonProps={{ disabled: !expireAck }}
        confirmLoading={loadingJob === 'expire'}
        onOk={runExpireFromModal}
        destroyOnClose
      >
        <p style={{ marginBottom: 16, color: '#374151', lineHeight: 1.55 }}>
          The job will expire overdue coin batches per platform rules. Confirm backups and internal process
          before running.
        </p>
        <Checkbox checked={expireAck} onChange={(e) => setExpireAck(e.target.checked)}>
          I understand this may permanently forfeit expired GZCoin and cannot be easily rolled back.
        </Checkbox>
      </Modal>
    </div>
  );
};

export default AdminCoinToolsPage;
