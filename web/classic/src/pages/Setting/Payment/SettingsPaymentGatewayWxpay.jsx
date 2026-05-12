/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useState, useRef } from 'react';
import { Banner, Button, Form, Row, Col, Spin } from '@douyinfe/semi-ui';
import { API, removeTrailingSlash, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingsPaymentGatewayWxpay(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle ? undefined : t('微信支付设置');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    WxpayEnabled: false,
    WxpayAppId: '',
    WxpayMchId: '',
    WxpayApiV3Key: '',
    WxpayCertSerialNo: '',
    WxpayPrivateKey: '',
    WxpayNotifyUrl: '',
    WxpayTimeoutMinutes: 30,
    WxpayMinTopUp: 1,
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        WxpayEnabled: props.options.WxpayEnabled || false,
        WxpayAppId: props.options.WxpayAppId || '',
        WxpayMchId: props.options.WxpayMchId || '',
        WxpayApiV3Key: props.options.WxpayApiV3Key || '',
        WxpayCertSerialNo: props.options.WxpayCertSerialNo || '',
        WxpayPrivateKey: props.options.WxpayPrivateKey || '',
        WxpayNotifyUrl: props.options.WxpayNotifyUrl || '',
        WxpayTimeoutMinutes:
          props.options.WxpayTimeoutMinutes !== undefined
            ? parseInt(props.options.WxpayTimeoutMinutes, 10)
            : 30,
        WxpayMinTopUp:
          props.options.WxpayMinTopUp !== undefined
            ? parseFloat(props.options.WxpayMinTopUp)
            : 1,
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitWxpaySetting = async () => {
    setLoading(true);
    try {
      const options = [];

      if (originInputs.WxpayEnabled !== inputs.WxpayEnabled) {
        options.push({ key: 'WxpayEnabled', value: inputs.WxpayEnabled ? 'true' : 'false' });
      }
      if (inputs.WxpayAppId !== originInputs.WxpayAppId) {
        options.push({ key: 'WxpayAppId', value: inputs.WxpayAppId });
      }
      if (inputs.WxpayMchId !== originInputs.WxpayMchId) {
        options.push({ key: 'WxpayMchId', value: inputs.WxpayMchId });
      }
      if (inputs.WxpayApiV3Key && inputs.WxpayApiV3Key !== originInputs.WxpayApiV3Key) {
        options.push({ key: 'WxpayApiV3Key', value: inputs.WxpayApiV3Key });
      }
      if (inputs.WxpayCertSerialNo !== originInputs.WxpayCertSerialNo) {
        options.push({ key: 'WxpayCertSerialNo', value: inputs.WxpayCertSerialNo });
      }
      if (inputs.WxpayPrivateKey && inputs.WxpayPrivateKey !== originInputs.WxpayPrivateKey) {
        options.push({ key: 'WxpayPrivateKey', value: inputs.WxpayPrivateKey });
      }
      if (inputs.WxpayNotifyUrl !== originInputs.WxpayNotifyUrl) {
        options.push({ key: 'WxpayNotifyUrl', value: removeTrailingSlash(inputs.WxpayNotifyUrl) });
      }
      if (inputs.WxpayTimeoutMinutes !== undefined && inputs.WxpayTimeoutMinutes !== originInputs.WxpayTimeoutMinutes) {
        options.push({ key: 'WxpayTimeoutMinutes', value: inputs.WxpayTimeoutMinutes.toString() });
      }
      if (inputs.WxpayMinTopUp !== undefined && inputs.WxpayMinTopUp !== originInputs.WxpayMinTopUp) {
        options.push({ key: 'WxpayMinTopUp', value: inputs.WxpayMinTopUp.toString() });
      }

      if (options.length === 0) {
        showSuccess(t('无更改'));
        setLoading(false);
        return;
      }

      const results = await Promise.all(
        options.map((opt) => API.put('/api/option/', { key: opt.key, value: opt.value }))
      );

      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => showError(res.data.message));
      } else {
        showSuccess(t('更新成功'));
        setOriginInputs({ ...inputs });
        props.refresh?.();
      }
    } catch (error) {
      showError(t('更新失败'));
    }
    setLoading(false);
  };

  const serverAddress = props.options?.ServerAddress
    ? removeTrailingSlash(props.options.ServerAddress)
    : t('网站地址');

  return (
    <Spin spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={sectionTitle}>
          <Banner
            type='info'
            description={
              <>
                {t('回调通知地址')}：<strong>{serverAddress}/api/wxpay/notify</strong>
                <br />
                {t('请在微信支付商户平台 → 产品中心 → Native支付 中配置以上回调地址，支付方式为 Native（扫码支付）。')}
              </>
            }
            style={{ marginBottom: 12 }}
          />
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='WxpayEnabled'
                size='default'
                checkedText='｜'
                uncheckedText='〇'
                label={t('启用微信支付')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='WxpayTimeoutMinutes'
                label={t('支付超时时间（分钟）')}
                placeholder='30'
                min={1}
                extraText={t('二维码有效时长')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='WxpayMinTopUp'
                label={t('最低充值数量')}
                placeholder='1'
                min={1}
              />
            </Col>
          </Row>
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }} style={{ marginTop: 16 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='WxpayAppId'
                label={t('App ID')}
                placeholder='wx...'
                extraText={t('微信 AppID')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='WxpayMchId'
                label={t('商户号')}
                placeholder='1xxxxxxxxx'
                extraText={t('微信支付商户号')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='WxpayCertSerialNo'
                label={t('证书序列号')}
                placeholder='...'
                extraText={t('商户 API 证书序列号')}
              />
            </Col>
          </Row>
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }} style={{ marginTop: 16 }}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='WxpayNotifyUrl'
                label={t('回调通知 URL')}
                placeholder={`${serverAddress}/api/wxpay/notify`}
                extraText={t('支付完成后微信服务器调用的地址')}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='WxpayApiV3Key'
                label={t('APIv3 密钥（32字节）')}
                placeholder={t('留空则保持当前不变')}
                type='password'
                extraText={t('在微信支付商户平台生成的 APIv3 密钥')}
              />
            </Col>
          </Row>
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }} style={{ marginTop: 16 }}>
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
              <Form.TextArea
                field='WxpayPrivateKey'
                label={t('商户私钥（PKCS8）')}
                placeholder={t('PEM 或纯 base64 编码的 PKCS8 私钥，留空则保持当前不变')}
                autosize={{ minRows: 4, maxRows: 8 }}
              />
            </Col>
          </Row>
          <Button onClick={submitWxpaySetting} style={{ marginTop: 16 }}>
            {t('更新微信支付设置')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}
