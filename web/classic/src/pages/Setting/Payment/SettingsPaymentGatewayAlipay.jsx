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

export default function SettingsPaymentGatewayAlipay(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle ? undefined : t('支付宝设置');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    AlipayEnabled: false,
    AlipayAppId: '',
    AlipayPrivateKey: '',
    AlipayPublicKey: '',
    AlipayNotifyUrl: '',
    AlipayReturnUrl: '',
    AlipayMinTopUp: 1,
    AlipaySandbox: false,
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        AlipayEnabled: props.options.AlipayEnabled || false,
        AlipayAppId: props.options.AlipayAppId || '',
        AlipayPrivateKey: props.options.AlipayPrivateKey || '',
        AlipayPublicKey: props.options.AlipayPublicKey || '',
        AlipayNotifyUrl: props.options.AlipayNotifyUrl || '',
        AlipayReturnUrl: props.options.AlipayReturnUrl || '',
        AlipayMinTopUp:
          props.options.AlipayMinTopUp !== undefined
            ? parseFloat(props.options.AlipayMinTopUp)
            : 1,
        AlipaySandbox: props.options.AlipaySandbox || false,
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitAlipaySetting = async () => {
    setLoading(true);
    try {
      const options = [];

      if (originInputs.AlipayEnabled !== inputs.AlipayEnabled) {
        options.push({ key: 'AlipayEnabled', value: inputs.AlipayEnabled ? 'true' : 'false' });
      }
      if (inputs.AlipayAppId !== originInputs.AlipayAppId) {
        options.push({ key: 'AlipayAppId', value: inputs.AlipayAppId });
      }
      if (inputs.AlipayPrivateKey && inputs.AlipayPrivateKey !== originInputs.AlipayPrivateKey) {
        options.push({ key: 'AlipayPrivateKey', value: inputs.AlipayPrivateKey });
      }
      if (inputs.AlipayPublicKey && inputs.AlipayPublicKey !== originInputs.AlipayPublicKey) {
        options.push({ key: 'AlipayPublicKey', value: inputs.AlipayPublicKey });
      }
      if (inputs.AlipayNotifyUrl !== originInputs.AlipayNotifyUrl) {
        options.push({ key: 'AlipayNotifyUrl', value: removeTrailingSlash(inputs.AlipayNotifyUrl) });
      }
      if (inputs.AlipayReturnUrl !== originInputs.AlipayReturnUrl) {
        options.push({ key: 'AlipayReturnUrl', value: removeTrailingSlash(inputs.AlipayReturnUrl) });
      }
      if (inputs.AlipayMinTopUp !== undefined && inputs.AlipayMinTopUp !== originInputs.AlipayMinTopUp) {
        options.push({ key: 'AlipayMinTopUp', value: inputs.AlipayMinTopUp.toString() });
      }
      if (originInputs.AlipaySandbox !== inputs.AlipaySandbox) {
        options.push({ key: 'AlipaySandbox', value: inputs.AlipaySandbox ? 'true' : 'false' });
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
                {t('异步通知地址')}：<strong>{serverAddress}/api/alipay/notify</strong>
                <br />
                {t('同步回调地址（可选）')}：<strong>{serverAddress}/console/log</strong>
                <br />
                {t('请在支付宝开放平台配置以上回调地址，并确保服务器地址可被支付宝服务器访问。')}
              </>
            }
            style={{ marginBottom: 12 }}
          />
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='AlipayEnabled'
                size='default'
                checkedText='｜'
                uncheckedText='〇'
                label={t('启用支付宝')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='AlipaySandbox'
                size='default'
                checkedText='｜'
                uncheckedText='〇'
                label={t('沙箱模式（测试用）')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='AlipayMinTopUp'
                label={t('最低充值数量')}
                placeholder='1'
                min={1}
              />
            </Col>
          </Row>
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }} style={{ marginTop: 16 }}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='AlipayAppId'
                label={t('App ID')}
                placeholder='2021xxxxxxxxxxxxxxx'
                extraText={t('支付宝开放平台应用 AppID')}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='AlipayNotifyUrl'
                label={t('异步通知 URL')}
                placeholder={`${serverAddress}/api/alipay/notify`}
                extraText={t('支付完成后支付宝服务器调用的地址')}
              />
            </Col>
          </Row>
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }} style={{ marginTop: 16 }}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='AlipayReturnUrl'
                label={t('同步回调 URL（可选）')}
                placeholder={`${serverAddress}/console/log`}
                extraText={t('用户支付完成后跳转的页面，留空则使用默认地址')}
              />
            </Col>
          </Row>
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }} style={{ marginTop: 16 }}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.TextArea
                field='AlipayPrivateKey'
                label={t('商户私钥（RSA2）')}
                placeholder={t('PEM 或纯 base64 编码的 PKCS1 私钥，留空则保持当前不变')}
                autosize={{ minRows: 4, maxRows: 8 }}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.TextArea
                field='AlipayPublicKey'
                label={t('支付宝平台公钥（用于验签）')}
                placeholder={t('PEM 或纯 base64 编码的公钥，留空则保持当前不变')}
                autosize={{ minRows: 4, maxRows: 8 }}
              />
            </Col>
          </Row>
          <Button onClick={submitAlipaySetting} style={{ marginTop: 16 }}>
            {t('更新支付宝设置')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}
