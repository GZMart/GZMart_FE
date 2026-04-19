import { useState, useEffect } from 'react';
import { Button, Tag, message, Result, Spin, Input, Select, Form, Avatar } from 'antd';
import {
  ShopOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, getCurrentUser } from '@store/slices/authSlice';
import * as sellerApplicationService from '@services/api/sellerApplicationService';
import addressService from '@services/api/addressService';
import locationService from '@services/api/locationService';
import useAddressAutocomplete from '@hooks/useAddressAutocomplete';
import AddressAutocompleteDropdown from '@components/common/AddressAutocompleteDropdown';
import {
  applyAddressSuggestion,
  applyGoongSuggestion,
  buildAddressDisplayString,
} from '@utils/addressAutocomplete';
import styles from '@assets/styles/buyer/SellerApplicationPage.module.css';

const STATUS_CONFIG = {
  pending: { color: 'processing', icon: <ClockCircleOutlined />, label: 'Pending Review' },
  approved: { color: 'success', icon: <CheckCircleOutlined />, label: 'Approved' },
  rejected: { color: 'error', icon: <CloseCircleOutlined />, label: 'Rejected' },
};

const SellerApplicationPage = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [form] = Form.useForm();

  const watchedAddress = Form.useWatch('address', form);
  const watchedProvinceName = Form.useWatch('provinceName', form);
  const watchedWardName = Form.useWatch('wardName', form);

  const {
    activeField: addressSuggestionField,
    setActiveField: setAddressSuggestionField,
    suggestions: addressSuggestions,
    showSuggestions: showAddressSuggestions,
    resolveSuggestionDetails,
  } = useAddressAutocomplete({
    addresses: savedAddresses,
    formValues: {
      street: watchedAddress || '',
      details: '',
      provinceName: watchedProvinceName || '',
      wardName: watchedWardName || '',
    },
  });

  useEffect(() => {
    fetchApplications();
    fetchProvinces();
    fetchSavedAddresses();
  }, []);

  useEffect(() => {
    if (applications.some((app) => app.status === 'approved') && user?.role === 'buyer') {
      dispatch(getCurrentUser());
    }
  }, [applications, user?.role, dispatch]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await sellerApplicationService.getMySellerApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    const data = await locationService.getProvinces();
    setProvinces(data || []);
  };

  const fetchSavedAddresses = async () => {
    try {
      const response = await addressService.getAddresses();
      const addressList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : response?.success && Array.isArray(response?.data)
            ? response.data
            : [];

      setSavedAddresses(addressList);
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
    }
  };

  const handleProvinceChange = async (value) => {
    const province = provinces.find((p) => String(p.code) === String(value));
    form.setFieldsValue({
      provinceCode: value,
      provinceName: province?.name || '',
      wardCode: undefined,
      wardName: '',
    });
    setWards([]);
    if (value) {
      const data = await locationService.getWards(value);
      setWards(data || []);
    }
  };

  const handleWardChange = (value) => {
    const ward = wards.find((w) => String(w.code) === String(value));
    form.setFieldsValue({
      wardCode: value,
      wardName: ward?.name || '',
    });
  };

  const handleAddressSuggestionSelect = async (suggestion) => {
    const resolvedSuggestion = await resolveSuggestionDetails(suggestion);
    const currentValues = form.getFieldsValue(true);

    let addressPatch;
    if (resolvedSuggestion?.source === 'goong') {
      addressPatch = applyGoongSuggestion({
        suggestion: resolvedSuggestion,
        activeField: 'street',
        provinces,
        wards,
        currentFormValues: {
          street: currentValues.address || '',
          details: '',
          provinceCode: currentValues.provinceCode,
          provinceName: currentValues.provinceName,
          wardCode: currentValues.wardCode,
          wardName: currentValues.wardName,
        },
      });
    } else {
      const savedPatch = applyAddressSuggestion(resolvedSuggestion);
      addressPatch = {
        ...savedPatch,
        street: buildAddressDisplayString(resolvedSuggestion),
      };
    }

    form.setFieldsValue({
      address: addressPatch.street || currentValues.address || '',
      provinceCode: addressPatch.provinceCode ? String(addressPatch.provinceCode) : undefined,
      provinceName: addressPatch.provinceName || currentValues.provinceName || '',
      wardCode: addressPatch.wardCode ? String(addressPatch.wardCode) : undefined,
      wardName: addressPatch.wardName || currentValues.wardName || '',
    });

    setAddressSuggestionField(null);
  };

  const hasPending = applications.some((app) => app.status === 'pending');

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      const profileData = {
        phone: values.phone,
        address: values.address,
        provinceCode: values.provinceCode,
        provinceName: values.provinceName,
        wardCode: values.wardCode,
        wardName: values.wardName,
        taxId: values.taxId,
        citizenId: values.citizenId,
      };
      await sellerApplicationService.createSellerApplication(profileData);
      message.success('Application submitted successfully!');
      fetchApplications();
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role === 'seller') {
    return (
      <div className={styles.page}>
        <Result
          status="success"
          title="You are already a seller!"
          subTitle="You can access your seller dashboard to manage your shop."
          extra={
            <Button type="primary" href="/seller/dashboard">
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.splitLayout}>
      {/* LEFT PANEL - Value Propositions */}
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.brandHeader}>
            <ShopOutlined className={styles.brandIcon} />
            <span className={styles.brandName}>GZMart Seller</span>
          </div>

          <h1 className={styles.heroTitle}>
            Take your business
            <br />
            to the next level.
          </h1>

          <p className={styles.heroSubtitle}>
            Join our elite fashion community in Guangzhou. Reach thousands of style-conscious
            customers globally.
          </p>

          <div className={styles.benefitsList}>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIconBox}>✨</div>
              <div>
                <h4 className={styles.benefitTitle}>0% Commission for 3 Months</h4>
                <p className={styles.benefitDesc}>
                  Keep 100% of your profits while you grow your store.
                </p>
              </div>
            </div>

            <div className={styles.benefitItem}>
              <div className={styles.benefitIconBox}>🚀</div>
              <div>
                <h4 className={styles.benefitTitle}>Global Exposure</h4>
                <p className={styles.benefitDesc}>
                  Access millions of active shoppers looking for unique styles.
                </p>
              </div>
            </div>

            <div className={styles.benefitItem}>
              <div className={styles.benefitIconBox}>🛡️</div>
              <div>
                <h4 className={styles.benefitTitle}>Seller Protection</h4>
                <p className={styles.benefitDesc}>
                  Comprehensive tools to protect your brand and transactions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className={styles.decorativeCircle1}></div>
        <div className={styles.decorativeCircle2}></div>
      </div>

      {/* RIGHT PANEL - Form & History */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          {loading && (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <p>Loading application data...</p>
            </div>
          )}

          {/* Application History */}
          {!loading && applications.length > 0 && (
            <section className={styles.historySection}>
              <h2 className={styles.sectionTitle}>Application Status</h2>
              <div className={styles.applicationList}>
                {applications.map((app) => {
                  const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={app._id} className={styles.applicationItem}>
                      <div className={styles.applicationInfo}>
                        <div className={styles.appHeaderRow}>
                          <span className={styles.appDate}>
                            {new Date(app.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <Tag icon={config.icon} color={config.color} className={styles.statusTag}>
                            {config.label.toUpperCase()}
                          </Tag>
                        </div>
                        {app.reviewNote && (
                          <div className={styles.reviewNote}>
                            <strong>Admin Note:</strong> {app.reviewNote}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Application Form */}
          {!loading && !hasPending && (
            <div className={styles.formWrapper}>
              <div className={styles.formHeader}>
                <h2 className={styles.sectionTitle}>Registration Form</h2>
                <p className={styles.formSubtitle}>Please provide your business details below.</p>
              </div>

              {/* User Profile Chip */}
              <div className={styles.userChip}>
                <Avatar size={48} src={user?.avatar} icon={<UserOutlined />} />
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user?.fullName}</div>
                  <div className={styles.userEmail}>{user?.email}</div>
                </div>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  phone: user?.phone || '',
                  address: user?.address || '',
                  provinceCode: user?.provinceCode || undefined,
                  provinceName: user?.provinceName || '',
                  wardCode: user?.wardCode || undefined,
                  wardName: user?.wardName || '',
                  taxId: user?.taxId || '',
                  citizenId: user?.citizenId || '',
                }}
                className={styles.modernForm}
                requiredMark={false}
              >
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Identity & Contact</h3>

                  <div className={styles.formGrid}>
                    <Form.Item
                      name="phone"
                      label="Phone Number"
                      rules={[
                        { required: true, message: 'Required' },
                        { pattern: /^[0-9]{10,11}$/, message: 'Invalid phone' },
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined className={styles.inputIcon} />}
                        placeholder="0901234567"
                        autoComplete="tel"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="citizenId"
                      label="Citizen ID"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input
                        prefix={<IdcardOutlined className={styles.inputIcon} />}
                        placeholder="079200001234"
                        size="large"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="taxId"
                    label="Tax ID (Mã số thuế)"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input
                      prefix={<BankOutlined className={styles.inputIcon} />}
                      placeholder="0123456789"
                      size="large"
                    />
                  </Form.Item>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Business Location</h3>

                  <div className={styles.formGrid}>
                    <Form.Item
                      name="provinceCode"
                      label="Province / City"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Select province"
                        optionFilterProp="label"
                        onChange={handleProvinceChange}
                        options={provinces.map((p) => ({ value: String(p.code), label: p.name }))}
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="wardCode"
                      label="Ward / Commune"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Select ward"
                        optionFilterProp="label"
                        onChange={handleWardChange}
                        disabled={wards.length === 0}
                        options={wards.map((w) => ({ value: String(w.code), label: w.name }))}
                        size="large"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="address"
                    label="Detailed Address"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <div style={{ position: 'relative' }}>
                      <Input.TextArea
                        placeholder="Floor 4, Bitexco Tower, District 1..."
                        rows={3}
                        autoSize={{ minRows: 3, maxRows: 5 }}
                        autoComplete="street-address"
                        size="large"
                        onFocus={() => setAddressSuggestionField('street')}
                        onBlur={() => setTimeout(() => setAddressSuggestionField(null), 150)}
                      />
                      <AddressAutocompleteDropdown
                        show={showAddressSuggestions && addressSuggestionField === 'street'}
                        suggestions={addressSuggestions}
                        onSelect={handleAddressSuggestionSelect}
                      />
                    </div>
                  </Form.Item>

                  {/* Hidden fields */}
                  <Form.Item name="provinceName" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name="wardName" hidden>
                    <Input />
                  </Form.Item>
                </div>

                <Form.Item style={{ marginTop: 40, marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    className={styles.submitBtn}
                    block
                  >
                    Submit Application
                  </Button>
                </Form.Item>
                <p className={styles.termsText}>
                  By submitting, you agree to the GZMart Seller Terms of Service and Privacy Policy.
                </p>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerApplicationPage;
