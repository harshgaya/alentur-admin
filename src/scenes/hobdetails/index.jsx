import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Form, Input, Select, Button, Row, Col, Avatar, Modal, Typography, message, Spin } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Country, State } from 'country-state-city';
import { useLocation, useNavigate } from 'react-router-dom';
// import {  } from "react-router-dom";

const { Text } = Typography;

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  const cropWidth = mediaWidth * 0.9;
  const cropHeight = cropWidth / aspect;
  const cropX = (mediaWidth - cropWidth) / 2;
  const cropY = (mediaHeight - cropHeight) / 2;
  return {
    unit: '%',
    x: (cropX / mediaWidth) * 100,
    y: (cropY / mediaHeight) * 100,
    width: (cropWidth / mediaWidth) * 100,
    height: (cropHeight / mediaHeight) * 100,
  };
}

const HobDetails = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const location = useLocation();
  const Navigate = useNavigate();
  const [form] = Form.useForm();

  // Use localTicket state for all ticket data
  const [localTicket, setLocalTicket] = useState(() => {
    const stored = localStorage.getItem('hob_ticket');
    return stored ? JSON.parse(stored) : (location.state?.ticket || {});
  });
  // const [localTicket, setLocalTicket] = useState(location.state?.ticket || {});

  useEffect(() => {
    if (localTicket.country) {
      const country = Country.getAllCountries().find((c) => c.name === localTicket.country);
      setSelectedCountry(country || null);
    }
    if (localTicket.state && selectedCountry) {
      const state = State.getStatesOfCountry(selectedCountry.isoCode).find((s) => s.name === localTicket.state);
      setSelectedState(state || null);
    }
  }, [localTicket, selectedCountry, selectedState]);

  const initialValues = useMemo(() => ({
    hobid: localTicket.hobid || "",
    firstName: localTicket.firstname || "",
    lastName: localTicket.lastname || '',
    street: localTicket.street || '',
    status: localTicket.status || '',
    email: localTicket.email || '',
    PhoneNo: localTicket.mobile || '',
    phoneCode: localTicket.phonecode || '',
    organization0: localTicket.organization || '',
    customerManager0: localTicket.customermanager || '',
    gender: localTicket.gender || '',
    imageUrl: localTicket.imageUrl || '',
  }), [localTicket]);

  // const [form] = Form.useForm();



const handleFormSubmit = async (values) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('hobid', values.hobid);
    formData.append('firstname', values.firstName);
    formData.append('lastname', values.lastName);
    formData.append('email', values.email);
    formData.append('phoneCode', values.phoneCode);
    formData.append('mobile', values.PhoneNo);
    formData.append('gender', values.gender);
    formData.append('status', values.status);

    const sessionData = JSON.parse(sessionStorage.getItem("userDetails"));
    const createrrole = sessionData?.extraind10 || "";
    const createrid = sessionData?.adminid || sessionData?.crmid || sessionData?.hobid || "";
    formData.append("createrrole", createrrole);
    formData.append("createrid", createrid);

    if (profileImage) {
      const arr = profileImage.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new Blob([u8arr], { type: mime });
      formData.append('hobProfileImage', file, 'profile.jpg');
    }
    try {
      const response = await fetch('http://161.35.54.196/api/api/v1/UpdateHobDetails', {
        method: 'POST',
        body: formData,
      });
      // const data = await response.json();
  const data = await response.json();
      if (response.ok) {
        setIsLoading(false);
        // const updatedTicket = {
        //   ...localTicket,
        //   hobid: values.hobid,
        //   name: `${values.firstName} ${values.lastName}`,
        //   street: values.street,
        //   status: values.status,
        //   email: values.email,
        //   mobile: values.PhoneNo,
        //   phonecode: values.phoneCode,
        //   gender: values.gender,
        //   imageUrl: profileImage || localTicket.imageUrl,
        // };
        // setLocalTicket(updatedTicket);
        // // Save to localStorage for persistence
        // localStorage.setItem('hob_ticket', JSON.stringify(updatedTicket));
        // form.setFieldsValue({
        //   hobid: updatedTicket.hobid,
        //   firstName: values.firstName,
        //   lastName: values.lastName,
        //   street: updatedTicket.street,
        //   status: updatedTicket.status,
        //   email: updatedTicket.email,
        //   PhoneNo: updatedTicket.mobile,
        //   phoneCode: updatedTicket.phonecode,
        //   gender: updatedTicket.gender,
        //   imageUrl: updatedTicket.imageUrl,
        // });
        message.success('Hob details updated successfully');
        setIsEditing(false);
        Navigate('/hob'); // Redirect to all Hobs page
      } else {
        alert('Update failed: ' + (data?.error || response.statusText));
      }
    } catch (error) {
      alert('Error submitting form');
    }
  };

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);


  // const handleFormSubmit = (values) => {
  //   // const formData = { ...values, profileImage: profileImage };
  //   setIsEditing(false);
  //   // handle submit
  // };

  const handleImageUpload = (event) => {
    if (!isEditing) return;
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImage(reader.result);
        setCropModalVisible(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (!isEditing) return;
    fileInputRef.current?.click();
  };

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }

  const handleCropComplete = (crop) => {
    setCompletedCrop(crop);
  };

  const handleCropImage = async () => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(reader.result);
          resolve(reader.result);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleSaveCroppedImage = async () => {
    await handleCropImage();
    setCropModalVisible(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const countries = Country.getAllCountries();
  // const states = selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [];
  // const cities = selectedState ? City.getCitiesOfState(selectedCountry?.isoCode, selectedState.isoCode) : [];
  // const customerManagers = ['Rambabu', 'Charan', 'Sathira', 'Jyothika'];
  const gender = ['Male', 'Female'];
  const status = ['Suspend', 'Active'];

  // getPhoneCodeDisplay removed as unused

  // const addOrgManagerPair = () => {
  //   setOrgManagerPairs([...orgManagerPairs, { org: '', manager: '' }]);
  // };

  // const removeOrgManagerPair = (index) => {
  //   if (orgManagerPairs.length > 1) {
  //     const updatedPairs = [...orgManagerPairs];
  //     updatedPairs.splice(index, 1);
  //     setOrgManagerPairs(updatedPairs);
  //   }
  // };

  return (
    <>
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          color: '#fff',
          fontSize: '20px',
        }}>
          <Spin size="large" fullscreen />
          {/* <div style={{ position: 'absolute', top: '60%', width: '100%', textAlign: 'center', color: '#fff', fontSize: 18 }}>
                        Loading... Please wait while we process your request.
                      </div> */}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 8, padding: 24, margin: 16 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleFormSubmit}
        >
          {/* Profile Image Section */}
          <Row justify="center" style={{ marginBottom: 24 }}>
            <Col>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={profileImage || initialValues.imageUrl || 'https://via.placeholder.com/150'}
                  size={120}
                  style={{ border: '2px solid #1677ff', cursor: isEditing ? 'pointer' : 'default', opacity: isEditing ? 1 : 0.8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  onClick={isEditing ? triggerFileInput : undefined}
                />
                <Button
                  icon={<CameraOutlined />}
                  shape="circle"
                  style={{ position: 'absolute', bottom: 0, right: 0, background: '#1677ff', color: '#fff', border: 'none', opacity: isEditing ? 1 : 0.7 }}
                  onClick={isEditing ? triggerFileInput : undefined}
                  disabled={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                />
              </div>
            </Col>
          </Row>
          <Modal
            open={cropModalVisible}
            title="Crop Profile Picture"
            onCancel={() => setCropModalVisible(false)}
            onOk={handleSaveCroppedImage}
            okText="Save Photo"
            cancelText="Cancel"
            width={400}
            bodyStyle={{ height: 350 }}
          >
            {originalImage && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={handleCropComplete}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={originalImage}
                  onLoad={onImageLoad}
                  style={{ maxHeight: '70vh', maxWidth: '100%' }}
                  alt="Crop preview"
                />
              </ReactCrop>
            )}
          </Modal>
          {/* Main Form Fields */}
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>ID</Text>}
                name="hobid"
                rules={[{ required: true, message: 'hob id is required' }]}
              >
                <Input placeholder="HOB ID" disabled={!isEditing} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>First Name</Text>}
                name="firstName"
                rules={[{ required: true, message: 'First name is required' }]}
              >
                <Input placeholder="First Name" disabled={!isEditing} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>Last Name</Text>}
                name="lastName"
                rules={[{ required: true, message: 'Last name is required' }]}
              >
                <Input placeholder="Last Name" disabled={!isEditing} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>Email Id</Text>}
                name="email"
                rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}
              >
                <Input placeholder="Email" disabled={!isEditing} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>Phone Number</Text>}
                required
              >
                <Input.Group compact>
                  <Form.Item
                    name="phoneCode"
                    noStyle
                    rules={[{ required: true, message: 'Code' }]}
                  >
                    <Select
                      showSearch
                      style={{ width: 160 }}
                      placeholder="Code"
                      optionFilterProp="children"
                      disabled={!isEditing}
                      size="large"
                    >
                      {countries.map((c) => (
                        <Select.Option key={c.isoCode} value={`+${c.phonecode}`}>{`+${c.phonecode} (${c.name})`}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="PhoneNo"
                    noStyle
                    rules={[
                      { required: true, message: 'Phone number is required' },
                      { pattern: /^[0-9]+$/, message: 'Only numbers allowed' },
                      { min: 10, message: 'At least 10 digits' },
                    ]}
                  >
                    <Input style={{ width: 'calc(100% - 160px)' }} placeholder="Phone Number" disabled={!isEditing} size="large" />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>Gender</Text>}
                name="gender"
                rules={[{ required: true, message: 'Gender is required' }]}
              >
                <Select placeholder="Select Gender" disabled={!isEditing} size="large">
                  {gender.map((g) => (
                    <Select.Option key={g} value={g}>{g}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {/* <Col xs={24} md={8}>
            <Form.Item
              label={<Text strong>Country</Text>}
              name="country"
              rules={[{ required: true, message: 'Country is required' }]}
            >
              <Select
                showSearch
                placeholder="Select Country"
                optionFilterProp="children"
                onChange={(val) => {
                  const country = countries.find((c) => c.name === val);
                  setSelectedCountry(country);
                  setSelectedState(null);
                  form.setFieldsValue({ state: '', city: '' });
                }}
                disabled={!isEditing}
                size="large"
              >
                {countries.map((c) => (
                  <Select.Option key={c.isoCode} value={c.name}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col> */}
            {/* <Col xs={24} md={8}>
            <Form.Item
              label={<Text strong>State</Text>}
              name="state"
              rules={[{ required: true, message: 'State is required' }]}
            >
              <Select
                showSearch
                placeholder="Select State"
                optionFilterProp="children"
                onChange={(val) => {
                  const state = states.find((s) => s.name === val);
                  setSelectedState(state);
                  form.setFieldsValue({ city: '' });
                }}
                disabled={!isEditing || !selectedCountry}
                size="large"
              >
                {states.map((s) => (
                  <Select.Option key={s.isoCode} value={s.name}>{s.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col> */}
            {/* <Col xs={24} md={8}>
            <Form.Item
              label={<Text strong>City</Text>}
              name="city"
              rules={[{ required: true, message: 'City is required' }]}
            >
              <Select
                showSearch
                placeholder="Select City"
                optionFilterProp="children"
                disabled={!isEditing || !selectedState}
                size="large"
              >
                {cities.map((c) => (
                  <Select.Option key={c.name} value={c.name}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col> */}
            {/* <Col xs={24} md={8}>
            <Form.Item
              label={<Text strong>Postal Code</Text>}
              name="postalcode"
              rules={[{ required: true, message: 'Postal code is required' }]}
            >
              <Input placeholder="Postal Code" disabled={!isEditing} size="large" />
            </Form.Item>
          </Col> */}
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>Status</Text>}
                name="status"
                rules={[{ required: true, message: 'Status is required' }]}
              >
                <Select placeholder="Select Status" disabled={!isEditing} size="large">
                  {status.map((s) => (
                    <Select.Option key={s} value={s}>{s}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {/* Organization/Manager Pairs */}
          {/* {orgManagerPairs.map((pair, index) => (
          <Row gutter={24} key={`pair-${index}`} align="middle">
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>{index === 0 ? 'Organization' : `Organization ${index + 1}`}</Text>}
                name={`organization${index}`}
                rules={[{ required: true, message: 'Organization is required' }]}
              >
                <Select
                  showSearch
                  placeholder="Select Organization"
                  optionFilterProp="children"
                  disabled={!isEditing}
                  size="large"
                >
                  {organizationNames.map((org) => (
                    <Select.Option key={org} value={org}>{org}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>{index === 0 ? 'Customer Manager' : `Customer Manager ${index + 1}`}</Text>}
                name={`customerManager${index}`}
                rules={[{ required: true, message: 'Customer Manager is required' }]}
              >
                <Select
                  showSearch
                  placeholder="Select Manager"
                  optionFilterProp="children"
                  disabled={!isEditing}
                  size="large"
                >
                  {customerManagers.map((m) => (
                    <Select.Option key={m} value={m}>{m}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8} style={{ display: isEditing ? 'flex' : 'none', alignItems: 'center' }}>
              {index === orgManagerPairs.length - 1 ? (
                <Button icon={<PlusOutlined />} onClick={addOrgManagerPair} style={{ marginRight: 8 }} disabled={!isEditing}>
                  Add More
                </Button>
              ) : (
                <Button icon={<MinusCircleOutlined />} onClick={() => removeOrgManagerPair(index)} danger disabled={!isEditing}>
                  Remove
                </Button>
              )}
            </Col>
          </Row>
        ))} */}
        </Form>
        {/* Form Actions moved outside the Form to keep buttons always enabled */}
        <Row justify="end" style={{ marginTop: 32 }} gutter={16}>
          {!isEditing ? (
            <Col>
              <Button type="primary" style={{ background: '#3e4396', color: '#fff', fontWeight: 'bold', borderRadius: 8 }} size="large" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </Col>
          ) : (
            <>
              <Col>
                <Button type="primary" htmlType="submit" size="large" style={{ background: "#3e4396" }} onClick={() => form.submit()}>
                  Save
                </Button>
              </Col>
              <Col>
                <Button size="large" danger onClick={handleCancel}>
                  Cancel
                </Button>
              </Col>
            </>
          )}
        </Row>
      </div>
    </>
  );
};

export default HobDetails;





