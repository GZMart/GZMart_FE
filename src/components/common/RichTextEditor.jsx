import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axiosClient from '../../services/axiosClient';
import styles from '@assets/styles/common/RichTextEditor.module.css';

// Suppress react-quill's internal findDOMNode deprecation warning
// (react-quill v2 uses legacy internal APIs; upgrade path exists in v3)
const _origError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('findDOMNode is deprecated')
  ) {
    return;
  }
  _origError(...args);
};

/**
 * RichTextEditor — Shopee-style description editor with text + images
 * Uses Quill with custom image handler that uploads to /api/upload/single
 *
 * Props:
 *   value     — HTML string (controlled)
 *   onChange  — (html: string) => void
 *   placeholder — optional placeholder text
 *   disabled  — optional
 *   minHeight — optional min height in px (default 200)
 */
const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Mô tả sản phẩm... Có thể thêm ảnh bằng nút 📷',
  disabled = false,
  minHeight = 200,
}) => {
  const quillRef = useRef(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      if (!file.type.startsWith('image/')) {
        return; // Silently ignore non-images
      }
      if (file.size > 5 * 1024 * 1024) {
        return; // Max 5MB
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await axiosClient.post('/api/upload/single', formData);
        const url = res?.data?.data?.url || res?.data?.url || res?.url;
        if (!url) {
          throw new Error('No URL returned');
        }

        const quill = quillRef.current?.getEditor?.();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1);
        }
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    };
  }, []);

  const modules = useCallback(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler]
  );

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image',
  ];

  return (
    <div className={styles.wrapper} style={{ minHeight: `${minHeight}px` }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules()}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        className={styles.editor}
      />
    </div>
  );
};

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  minHeight: PropTypes.number,
};

export default RichTextEditor;
