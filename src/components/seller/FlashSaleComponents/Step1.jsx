import { Form, Input, DatePicker, Button } from 'antd';
import { message } from 'antd';
import dayjs from 'dayjs';
import CollapsibleHelpBox from './CollapsibleHelpBox';
import styles from '@assets/styles/seller/FlashSales.module.css';

const Step1 = ({ campaignInfo, setCampaignInfo, selectedFlashSale, onNext, onCancel }) => {
  const isEditMode = !!selectedFlashSale;

  return (
    <div className={styles.step1Container}>
      <h3 className={styles.step1Title}>Campaign Details</h3>
      <p className={styles.step1Desc}>
        Define the foundational details for your high-velocity campaign.
      </p>

      <Form layout="vertical">
        <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600 }}>Campaign Title</span>}>
          <Input
            placeholder="E.g., Weekend Flash Sale, Summer Clearance…"
            value={campaignInfo.title}
            onChange={(e) => setCampaignInfo((p) => ({ ...p, title: e.target.value }))}
            maxLength={100}
            style={{ borderRadius: 10, fontSize: 13 }}
            disabled={isEditMode}
          />
        </Form.Item>

        <div className={styles.formRow}>
          <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600 }}>Start Time</span>}>
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%', borderRadius: 10 }}
              value={campaignInfo.startTime}
              onChange={(val) => setCampaignInfo((p) => ({ ...p, startTime: val }))}
              disabledDate={(d) => d && d < dayjs().startOf('day')}
              disabled={isEditMode}
              placeholder="Select start time"
            />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600 }}>End Time</span>}>
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%', borderRadius: 10 }}
              value={campaignInfo.endTime}
              onChange={(val) => setCampaignInfo((p) => ({ ...p, endTime: val }))}
              disabledDate={(d) => {
                if (!campaignInfo.startTime) {
return d && d <= dayjs();
}
                return d && d <= campaignInfo.startTime;
              }}
              disabled={isEditMode}
              placeholder="Select end time"
            />
          </Form.Item>
        </div>
      </Form>

      {/* Live Countdown Preview */}
      {campaignInfo.startTime && campaignInfo.endTime && !isEditMode && (
        <div className={styles.countdownCard}>
          <div className={styles.countdownIconWrap}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className={styles.countdownContent}>
            <div className={styles.countdownLabel}>Campaign Duration</div>
            <div className={styles.countdownValue}>
              {(() => {
                const dur = campaignInfo.endTime.diff(campaignInfo.startTime);
                const d = Math.floor(dur / 86400000);
                const h = Math.floor((dur % 86400000) / 3600000);
                const m = Math.floor((dur % 3600000) / 60000);
                return `⏱ Time remaining: ${d > 0 ? `${d} days ` : ''}${h > 0 ? `${h} hours ` : ''}${m > 0 ? `${m} minutes` : ''}`;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Help Box */}
      {!isEditMode && <CollapsibleHelpBox />}

      <div className={styles.stepFooter}>
        <div className={styles.stepFooterLeft}>
          <Button onClick={onCancel} className={styles.btnBack}>
            Cancel
          </Button>
        </div>
        <div className={styles.stepFooterRight}>
          <Button
            className={styles.btnNext}
            onClick={() => {
              if (!campaignInfo.title?.trim()) {
                message.warning('Please enter a campaign title');
                return;
              }
              if (!campaignInfo.startTime) {
                message.warning('Please select a start time');
                return;
              }
              if (!campaignInfo.endTime) {
                message.warning('Please select an end time');
                return;
              }
              if (!isEditMode) {
                if (campaignInfo.endTime.isBefore(campaignInfo.startTime)) {
                  message.warning('End time must be after start time');
                  return;
                }
                if (campaignInfo.startTime.isBefore(dayjs().subtract(1, 'minute'))) {
                  message.warning('Start time cannot be in the past');
                  return;
                }
              }
              onNext();
            }}
          >
            Next Step
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step1;
