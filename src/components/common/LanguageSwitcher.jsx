import { useEffect, useState, useRef } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import styles from '@assets/styles/common/LanguageSwitcher.module.css';

const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = i18n.language;
  const langLabel =
    currentLang === 'vi'
      ? t('common.languageVietnamese', 'Tiếng Việt')
      : t('common.languageEnglish', 'English');

  return (
    <div className={styles.wrap} ref={dropdownRef}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => setShowDropdown(!showDropdown)}
        title={t('common.changeLanguage', 'Change Language')}
      >
        <Globe size={14} />
        <span>{langLabel}</span>
        <ChevronDown
          size={12}
          style={{
            transition: 'transform 0.2s',
            transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {showDropdown && (
        <div className={styles.dropdown}>
          <div
            className={styles.dropdownItem}
            style={{
              color: currentLang === 'vi' ? '#1677ff' : '#64748b',
              fontWeight: currentLang === 'vi' ? '600' : '400',
            }}
            onClick={() => {
              i18n.changeLanguage('vi');
              setShowDropdown(false);
            }}
          >
            <span className={styles.flag}>🇻🇳</span>
            <span>{t('common.languageVietnamese', 'Tiếng Việt')}</span>
            {currentLang === 'vi' && <span className={styles.check}>✓</span>}
          </div>
          <div
            className={styles.dropdownItem}
            style={{
              color: currentLang === 'en' ? '#1677ff' : '#64748b',
              fontWeight: currentLang === 'en' ? '600' : '400',
            }}
            onClick={() => {
              i18n.changeLanguage('en');
              setShowDropdown(false);
            }}
          >
            <span className={styles.flag}>🇺🇸</span>
            <span>{t('common.languageEnglish', 'English')}</span>
            {currentLang === 'en' && <span className={styles.check}>✓</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
