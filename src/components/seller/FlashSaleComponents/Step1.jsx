import { Form, Input, DatePicker, Button, Tooltip } from 'antd';
import { message } from 'antd';
import dayjs from 'dayjs';
import CollapsibleHelpBox from './CollapsibleHelpBox';
import styles from '@assets/styles/seller/FlashSales.module.css';

// Deal type configuration with icons and labels
const DEAL_TYPES = [
  {
    value: 'flash_sale',
    label: '⚡ Flash Sale',
    description: 'Ưu đãi cực sốc trong thời gian ngắn (1-48h)',
    color: '#ff4757',
    // Validation rules
    maxDurationHours: 48,
    minDurationHours: 1,
    suggestDuration: '1-48 giờ',
  },
  {
    value: 'daily_deal',
    label: '📅 Deal Trong Ngày',
    description: 'Khuyến mãi hiệu lực trong 1 ngày',
    color: '#ffa502',
    maxDurationHours: 24,
    minDurationHours: 1,
    suggestDuration: 'Tối đa 24 giờ',
    validateSameDay: true,
  },
  {
    value: 'weekly_deal',
    label: '📆 Deal Tuần',
    description: 'Ưu đãi kéo dài cả tuần (1-7 ngày)',
    color: '#2ed573',
    maxDurationHours: 168, // 7 days
    minDurationHours: 1,
    suggestDuration: '1-7 ngày',
  },
  {
    value: 'limited_time',
    label: '⏳ Giới Hạn Thời Gian',
    description: 'Khuyến mãi dài hạn theo mùa/lễ',
    color: '#1e90ff',
    maxDurationHours: null, // No limit
    minDurationHours: 1,
    suggestDuration: 'Không giới hạn',
  },
  {
    value: 'clearance',
    label: '🏷️ Clearance',
    description: 'Xả kho, giá tốt nhất',
    color: '#a55eea',
    maxDurationHours: null,
    minDurationHours: 1,
    suggestDuration: 'Không giới hạn',
  },
  {
    value: 'special',
    label: '🎯 Special',
    description: 'Ưu đãi đặc biệt cho VIP',
    color: '#ff6b81',
    maxDurationHours: null,
    minDurationHours: 1,
    suggestDuration: 'Không giới hạn',
  },
];

/**
 * Calculate duration between two times in hours
 */
const getDurationHours = (startTime, endTime) => {
  if (!startTime || !endTime) {
return null;
}
  return endTime.diff(startTime, 'hour', true);
};

const Step1 = ({ campaignInfo, setCampaignInfo, selectedFlashSale, onNext, onCancel }) => {
  const isEditMode = !!selectedFlashSale;
  const currentType = campaignInfo.type || 'flash_sale';
  const selectedTypeConfig = DEAL_TYPES.find(t => t.value === currentType) || DEAL_TYPES[0];

  // Tính max end date dựa trên type và start time
  const getMaxEndTime = (startTime) => {
    if (!startTime) {
return null;
}
    const typeConfig = DEAL_TYPES.find(t => t.value === currentType);
    if (!typeConfig || !typeConfig.maxDurationHours) {
return null;
} // Không giới hạn
    return startTime.add(typeConfig.maxDurationHours, 'hour');
  };

  // Tính min end date dựa trên type và start time
  const getMinEndTime = (startTime) => {
    if (!startTime) {
return null;
}
    const typeConfig = DEAL_TYPES.find(t => t.value === currentType);
    if (!typeConfig) {
return null;
}
    return startTime.add(typeConfig.minDurationHours, 'hour');
  };

  // Validation state cho duration warning
  const durationValidation = campaignInfo.startTime && campaignInfo.endTime
    ? (() => {
        const durationHours = getDurationHours(campaignInfo.startTime, campaignInfo.endTime);
        const typeConfig = DEAL_TYPES.find(t => t.value === currentType);
        if (!typeConfig) {
return null;
}

        // Check min duration
        if (durationHours < typeConfig.minDurationHours) {
          return {
            valid: false,
            message: `${typeConfig.label} phải kéo dài ít nhất ${typeConfig.minDurationHours} giờ`,
          };
        }

        // Check max duration
        if (typeConfig.maxDurationHours && durationHours > typeConfig.maxDurationHours) {
          if (typeConfig.validateSameDay) {
            return {
              valid: false,
              message: `${typeConfig.label} chỉ có thể chạy trong 1 ngày. Vui lòng chọn giờ kết thúc trước 23:59 cùng ngày.`,
            };
          }
          return {
            valid: false,
            message: `${typeConfig.label} chỉ được kéo dài tối đa ${typeConfig.suggestDuration}`,
          };
        }

        return { valid: true };
      })()
    : null;

  // Calculate current duration for display
  const currentDurationHours = campaignInfo.startTime && campaignInfo.endTime
    ? getDurationHours(campaignInfo.startTime, campaignInfo.endTime)
    : null;

  // Handler khi thay đổi start time - reset end time nếu không hợp lệ
  const handleStartTimeChange = (val) => {
    const newStartTime = val;
    let newEndTime = campaignInfo.endTime;

    // Nếu end time hiện tại vượt quá max cho phép, reset
    if (newStartTime && newEndTime) {
      const maxEnd = getMaxEndTime(newStartTime);
      if (maxEnd && newEndTime.isAfter(maxEnd)) {
        newEndTime = null;
        message.warning(`${selectedTypeConfig.label} chỉ kéo dài tối đa ${selectedTypeConfig.suggestDuration}. End time đã được reset.`);
      }
    }

    setCampaignInfo((p) => ({ ...p, startTime: newStartTime, endTime: newEndTime }));
  };

  return (
    <div className={styles.step1Container}>
      <h3 className={styles.step1Title}>Campaign Details</h3>
      <p className={styles.step1Desc}>
        Define the foundational details for your high-velocity campaign.
      </p>

      <Form layout="vertical">
        {/* Campaign Type Selector */}
        <Form.Item
          label={<span style={{ fontSize: 12, fontWeight: 600 }}>Campaign Type</span>}
          required
        >
          <div className={styles.typeSelectorGrid}>
            {DEAL_TYPES.map((type) => (
              <Tooltip key={type.value} title={type.description} placement="top">
                <button
                  type="button"
                  className={`${styles.typeCard} ${currentType === type.value ? styles.typeCardActive : ''}`}
                  onClick={() => setCampaignInfo((p) => ({ ...p, type: type.value, endTime: null }))}
                  disabled={isEditMode}
                  style={{
                    '--type-color': type.color,
                    borderColor: currentType === type.value ? type.color : undefined,
                    backgroundColor: currentType === type.value ? `${type.color}15` : undefined,
                  }}
                >
                  <span className={styles.typeCardLabel}>{type.label}</span>
                </button>
              </Tooltip>
            ))}
          </div>
        </Form.Item>

        {/* Type Duration Info */}
        <div className={styles.typeDurationInfo}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: selectedTypeConfig.color }}>
            info
          </span>
          <span>
            Thời gian: <strong>{selectedTypeConfig.suggestDuration}</strong>
            {selectedTypeConfig.validateSameDay && ' (trong cùng ngày)'}
          </span>
        </div>

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
              onChange={handleStartTimeChange}
              disabledDate={(d) => d && d < dayjs().startOf('day')}
              disabled={isEditMode}
              placeholder="Select start time"
              allowClear={!isEditMode}
              onClear={() => setCampaignInfo((p) => ({ ...p, startTime: null, endTime: null }))}
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
                // Chặn ngày trước start time
                if (d && d.isBefore(campaignInfo.startTime, 'day')) {
                  return true;
                }
                // Nếu cùng ngày với start time
                if (d && d.isSame(campaignInfo.startTime, 'day')) {
                  // Chặn giờ trước start time (cùng ngày)
                  if (d.isBefore(campaignInfo.startTime)) {
                    return true;
                  }
                }
                // Chặn ngày sau max duration
                const maxEnd = getMaxEndTime(campaignInfo.startTime);
                if (maxEnd && d && d.isAfter(maxEnd, 'minute')) {
                  return true;
                }
                return false;
              }}
              disabled={isEditMode || !campaignInfo.startTime}
              placeholder={campaignInfo.startTime ? "Select end time" : "Select start time first"}
            />
          </Form.Item>
        </div>
      </Form>

      {/* Duration Validation Warning */}
      {durationValidation && !durationValidation.valid && (
        <div className={styles.durationWarning}>
          <span className="material-symbols-outlined">warning</span>
          <span>{durationValidation.message}</span>
        </div>
      )}

      {/* Duration Info */}
      {currentDurationHours !== null && durationValidation?.valid && (
        <div className={styles.durationInfo}>
          <span className="material-symbols-outlined">schedule</span>
          <span>
            Thời lượng: <strong>{currentDurationHours.toFixed(1)} giờ</strong>
            {currentDurationHours <= 24 && ' (trong 1 ngày)'}
            {currentDurationHours > 24 && currentDurationHours <= 168 && ` (${(currentDurationHours / 24).toFixed(1)} ngày)`}
            {currentDurationHours > 168 && ` (${(currentDurationHours / 24).toFixed(0)} ngày)`}
          </span>
        </div>
      )}

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
