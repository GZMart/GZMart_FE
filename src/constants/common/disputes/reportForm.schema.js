import * as yup from 'yup';

export const REPORT_TYPES = {
  PRODUCT: 'product',
  ORDER: 'order',
  SELLER: 'seller',
  SYSTEM_BUG: 'system_bug',
};

export const REPORT_TYPE_OPTIONS = [
  {
    value: REPORT_TYPES.PRODUCT,
    label: 'PRODUCT',
    description: 'Report a specific product listing',
  },
  {
    value: REPORT_TYPES.ORDER,
    label: 'ORDER',
    description: 'Report an issue in an order flow',
  },
  {
    value: REPORT_TYPES.SELLER,
    label: 'SELLER',
    description: 'Report a shop owner behavior',
  },
  {
    value: REPORT_TYPES.SYSTEM_BUG,
    label: 'SYSTEM_BUG',
    description: 'Report app/UI or technical issue',
  },
];

export const REPORT_CATEGORIES_BY_TYPE = {
  [REPORT_TYPES.PRODUCT]: [
    { value: 'counterfeit', label: 'Counterfeit / Fake item' },
    { value: 'wrong_description', label: 'Not as described' },
    { value: 'quality_issue', label: 'Product quality issue' },
    { value: 'damaged_item', label: 'Damaged item' },
    { value: 'prohibited_item', label: 'Prohibited / unsafe item' },
  ],
  [REPORT_TYPES.ORDER]: [
    { value: 'missing_item', label: 'Missing item in order' },
    { value: 'wrong_item', label: 'Wrong item delivered' },
    { value: 'delivery_delay', label: 'Delivery delayed too long' },
    { value: 'order_not_received', label: 'Order marked delivered but not received' },
    { value: 'refund_problem', label: 'Refund / return problem' },
  ],
  [REPORT_TYPES.SELLER]: [
    { value: 'abusive_behavior', label: 'Abusive or inappropriate behavior' },
    { value: 'fraud_suspected', label: 'Fraud suspected' },
    { value: 'spam_scam', label: 'Spam / scam messages' },
    { value: 'policy_violation', label: 'Policy violation' },
    { value: 'unresponsive_support', label: 'Unresponsive seller support' },
  ],
  [REPORT_TYPES.SYSTEM_BUG]: [
    { value: 'checkout_bug', label: 'Checkout / payment bug' },
    { value: 'ui_display_bug', label: 'UI / display bug' },
    { value: 'performance_issue', label: 'Performance / slow loading' },
    { value: 'notification_bug', label: 'Notification bug' },
    { value: 'other_system_bug', label: 'Other system bug' },
  ],
};

const getAllowedCategoryValues = (type) =>
  (REPORT_CATEGORIES_BY_TYPE[type] || []).map((item) => item.value);

export const reportFormSchema = yup.object({
  type: yup
    .string()
    .oneOf(Object.values(REPORT_TYPES), 'Invalid report type')
    .required('Select a report type'),
  title: yup
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .required('Enter a title'),
  category: yup
    .string()
    .trim()
    .required('Select a category')
    .test(
      'category-in-type',
      'Category is not valid for the selected report type',
      function (value) {
        const { type } = this.parent || {};
        if (!type || !value) {
          return false;
        }

        return getAllowedCategoryValues(type).includes(value);
      }
    ),
  description: yup
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters')
    .required('Describe the issue'),
  orderId: yup
    .string()
    .trim()
    .when('type', {
      is: REPORT_TYPES.ORDER,
      then: (schema) => schema.required('Select an order'),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),
  productId: yup
    .string()
    .trim()
    .when('type', {
      is: REPORT_TYPES.PRODUCT,
      then: (schema) => schema.required('Select a product to report'),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),
  sellerId: yup
    .string()
    .trim()
    .when('type', {
      is: REPORT_TYPES.SELLER,
      then: (schema) => schema.required('Select a seller to report'),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),
});

export const validateReportForm = async (values) => {
  return reportFormSchema.validate(values, {
    abortEarly: false,
    stripUnknown: true,
  });
};
