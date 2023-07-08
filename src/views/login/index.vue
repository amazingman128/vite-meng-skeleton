<template>
  <div class="flex flex-row w-screen h-screen ">
    <div class="basis-1/3 bg-blue">
      <h1 class="text-red"></h1>
    </div>

    <div class="basis-2/3  ">
      <CodeBlock
        :highlightjs="true"
        :code="escapeTemplateString(myCode)"
        label="My Code"
        lang="javascript"
        
      />
    </div>
  </div>
</template>

<script setup lang="ts">
    var myCode =`package com.jucai.pay.channel.lakala.service;

import cn.hutool.core.lang.UUID;
import cn.hutool.core.map.MapUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.jucai.common.core.constant.CacheConstants;
import com.jucai.common.core.constant.SecurityConstants;
import com.jucai.common.core.domain.R;
import com.jucai.common.core.enums.PayResultCodeEnum;
import com.jucai.common.core.exception.pay.PayException;
import com.jucai.common.core.utils.DateUtils;
import com.jucai.common.core.utils.StringUtils;
import com.jucai.common.core.utils.sign.Md5Utils;
import com.jucai.common.redis.service.RedisService;
import com.jucai.common.security.utils.SecurityUtils;
import com.jucai.mch.api.domain.JcApplication;
import com.jucai.mch.api.domain.JcChannel;
import com.jucai.mch.api.domain.JcChannelConfig;
import com.jucai.order.api.RemoteOrderService;
import com.jucai.order.api.enums.OrderStatusEnum;
import com.jucai.order.api.enums.PaySceneEnum;
import com.jucai.order.api.model.command.SetOrderStatusCommand;
import com.jucai.order.api.model.command.UpdateESOrderInfoCommand;
import com.jucai.order.api.model.entity.JcPayOrder;
import com.jucai.pay.api.enums.WayCodeEnum;
import com.jucai.pay.api.model.AbstractMchAppReq;
import com.jucai.pay.api.model.payway.*;
import com.jucai.pay.channel.handler.CanWayCodeUseHandler;
import com.jucai.pay.channel.lakala.LakalaChannelConfig;
import com.jucai.pay.channel.lakala.LakalaConfig;
import com.jucai.pay.channel.lakala.UrlConstants;
import com.jucai.pay.channel.lakala.convert.LakalaConvert;
import com.jucai.pay.channel.lakala.enums.LakalaCashierTraceStatus;
import com.jucai.pay.channel.lakala.enums.LakalaTraceStatus;
import com.jucai.pay.channel.lakala.model.LakalaAuthData;
import com.jucai.pay.channel.lakala.model.request.*;
import com.jucai.pay.channel.lakala.model.request.b2c.LakalaB2CReq;
import com.jucai.pay.channel.lakala.model.request.c2b.LakalaC2BReq;
import com.jucai.pay.channel.lakala.model.request.callback.LakalaCashierCallbackReq;
import com.jucai.pay.channel.lakala.model.request.callback.LakalaCommonCallbackReq;
import com.jucai.pay.channel.lakala.model.request.refund.LakalaRefundReq;
import com.jucai.pay.channel.lakala.model.request.unified.LakalaUnifiedOrderReq;
import com.jucai.pay.channel.lakala.model.response.LakalaBaseResp;
import com.jucai.pay.channel.lakala.model.response.LakalaCancelOrderResp;
import com.jucai.pay.channel.lakala.model.response.LakalaCloseOrderResp;
import com.jucai.pay.channel.lakala.model.response.b2c.LakalaB2CResp;
import com.jucai.pay.channel.lakala.model.response.c2b.LakalaC2BResp;
import com.jucai.pay.channel.lakala.model.response.orderinfo.cashier.LakalaCashierOrderResp;
import com.jucai.pay.channel.lakala.model.response.orderinfo.common.LakalaCommonOrderResp;
import com.jucai.pay.channel.lakala.model.response.refund.LakalaRefundQueryResp;
import com.jucai.pay.channel.lakala.model.response.refund.LakalaRefundResp;
import com.jucai.pay.channel.lakala.model.response.unified.LakalaUnifiedOrderResp;
import com.jucai.pay.channel.lakala.utils.HttpClientPool;
import com.jucai.pay.channel.lakala.utils.LakalaUtils;
import com.jucai.pay.handler.PlayVoiceNotifyHandler;
import com.jucai.pay.service.IPayChannelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.client.producer.SendCallback;
import org.apache.rocketmq.client.producer.SendResult;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static com.jucai.common.core.enums.PayResultCodeEnum.SUCCESS;

/**
 * 拉卡拉支付服务
 *
 * @author lizuokuan
 */
@Slf4j
@Service("lakalaPayService")
@RequiredArgsConstructor
public class LakalaPayServiceImpl implements IPayChannelService<AbstractMchAppReq> {

    private static final long REDIS_TIMEOUT = 10L;


    private final LakalaConfig lakalaConfig;

    private final RedisService redisService;

    private final RemoteOrderService remoteOrderService;

    private final CanWayCodeUseHandler canWayCodeUseHandler;

    /**
     * 消息队列服务
     */
    private final RocketMQTemplate rocketMQTemplate;


    /**
     * 云喇叭播放
     */
    private final PlayVoiceNotifyHandler playVoiceNotifyHandler;


    @Value("\${rocketmq.producer.payOrderESInfo.destination}")
    private String orderlyMessageDestination;

    private ThreadLocal<LakalaChannelConfig> lakalaChannelConfig = new ThreadLocal<>();

    /**
     * 加载支付通道配置信息
     *
     * @param appId
     */
//    private void loadConfig(String appId) {
//        JSONObject json = redisService.getCacheObject(CacheConstants.CONFIG_PARAMS + appId);
//        if (ObjectUtil.isNull(json)) {
//            log.error("[3cb5b29b-14a4-4144-8c31-1bb0043d369f]-获取通道配置信息异常，应用ID:{}", appId);
//            throw new PayException("加载支付通道配置信息失败");
//        }
//        LakalaChannelConfig channelConfig = new LakalaChannelConfig();
//        channelConfig.setAppId(json.getString("appId"));
//        channelConfig.setMerchantNo(json.getString("merchantNo"));
//        channelConfig.setSerialNo(json.getString("serialNo"));
//        channelConfig.setVposId(json.getString("vposId"));
//        channelConfig.setTermNo(json.getString("termNo"));
//        channelConfig.setPrivateKey(json.getString("privateKey"));
//        channelConfig.setApiBaseCert(json.getString("apiBaseCert"));
//        channelConfig.setApiGwCert(json.getString("apiGwCert"));
//        lakalaChannelConfig.set(channelConfig);
//    }

    /**
     * 加载支付通道配置信息
     *
     * @param appId
     */
    private void loadConfig(String mchNo, String appId) {
        Map<String, Object> map = redisService.getCacheMap(CacheConstants.PAY_PARAMS + mchNo + appId);
        if (MapUtil.isEmpty(map)) {
            log.error("[6BE0002FC7EE4E28965B7234A92EF2E7]-获取通道配置信息异常，应用ID:{},商户号:{}", appId, mchNo);
            throw new PayException("加载支付通道配置信息失败");
        }
        // 根据应用id获取支付通道
        JcApplication applyInfo = JSON.parseObject(JSON.toJSONString(map.get("application")), JcApplication.class);
        JSONObject applyInfoJSON = JSON.parseObject(applyInfo.getAppParams());
        // 获取通道配置信息
        JcChannelConfig channelConfig = JSON.parseObject(JSON.toJSONString(map.get("channelConfig")), JcChannelConfig.class);
        JSONObject channelConfigJSON = JSON.parseObject(channelConfig.getIfParams());

        LakalaChannelConfig configResult = new LakalaChannelConfig();
        configResult.setAppId(channelConfigJSON.getString("appId"));
        configResult.setSerialNo(channelConfigJSON.getString("serialNo"));
        configResult.setMerchantNo(applyInfoJSON.getString("channelMchId"));
        configResult.setVposId(applyInfoJSON.getString("vposId"));
        configResult.setTermNo(applyInfoJSON.getString("termNo"));
        configResult.setMerchantNoB2B(applyInfoJSON.getString("channelMchIdB2B"));
        configResult.setVposIdB2B(applyInfoJSON.getString("vposIdB2B"));
        configResult.setTermNoB2B(applyInfoJSON.getString("termNoB2B"));
        configResult.setPrivateKey(channelConfigJSON.getString("privateKey"));
        configResult.setApiBaseCert(channelConfigJSON.getString("apiBaseCert"));
        configResult.setApiGwCert(channelConfigJSON.getString("apiGwCert"));
        lakalaChannelConfig.set(configResult);
    }


    /**
     * 缓存加密参数
     *
     * @param req       请求实体
     * @param notifyUrl 回调地址
     */
    private void cacheConfigs(AbstractMchAppReq req, String notifyUrl) {
        // 缓存请求方回调地址
        redisService.setCacheObject(CacheConstants.NOTIFY_URL + req.getMchOrderNo(), notifyUrl, REDIS_TIMEOUT, TimeUnit.MINUTES);
        // 缓存请求方md5 key
        String mchKey = StringUtils.isBlank(redisService.getCacheObject(CacheConstants.MD5_KEY + SecurityUtils.getTenantId())) ? redisService.getCacheObject(CacheConstants.MD5_KEY + SecurityUtils.getOrgId()) : redisService.getCacheObject(CacheConstants.MD5_KEY + SecurityUtils.getTenantId());
        redisService.setCacheObject(CacheConstants.MD5_KEY + req.getMchNo(), mchKey, REDIS_TIMEOUT, TimeUnit.MINUTES);
        // 缓存请求方orgId
        redisService.setCacheObject(CacheConstants.ORG_ID + req.getMchNo(), SecurityUtils.getOrgId(), REDIS_TIMEOUT, TimeUnit.MINUTES);
        // 缓存请求方商户号
        redisService.setCacheObject(CacheConstants.MCH_ID + req.getMchNo(), SecurityUtils.getTenantId(), REDIS_TIMEOUT, TimeUnit.MINUTES);
        // 缓存请求方支付参数
        redisService.setCacheObject(CacheConstants.CONFIG_PARAMS + req.getMchNo(), redisService.getCacheObject(CacheConstants.CONFIG_PARAMS + req.getAppId()), REDIS_TIMEOUT, TimeUnit.MINUTES);
    }


    /**
     * 构建基础请求对象
     *
     * @param data 请求数据
     * @return
     */
    private LakalaBaseReq buildBaseReq(String appId, Object data) {
        LakalaBaseReq lakalaBaseReq = LakalaBaseReq.builder().build();
        lakalaBaseReq.setReq_data(data);
        lakalaBaseReq.setReq_time(DateUtils.dateTimeNow());
        lakalaBaseReq.setVersion("3.0");
        lakalaBaseReq.setOut_org_code(appId);
        return lakalaBaseReq;
    }


    /**
     * 构造请求头
     *
     * @param authorization
     * @return
     */
    private Map<String, String> buildRequestHeader(String authorization) {
        Map<String, String> headerMap = new HashMap<>();
        headerMap.put("Authorization", LakalaUtils.SCHEMA + " " + authorization);
        headerMap.put("Accept", "application/json");
        headerMap.put("Content-Type", "application/json");
        return headerMap;
    }


    @Override
    public B2CUnifiedOrderResp b2cUnifiedOrder(AbstractMchAppReq req) throws Exception {
        if (ObjectUtil.isNull(req)) {
            throw new PayException("请求参数为空", "46B99FF78CE147448CE3291DBB57678E");
        }
        B2CUnifiedOrderReq b2cReq = (B2CUnifiedOrderReq) req;
        // 根据应用id判断支付方式是否可用
        canWayCodeUseHandler.wayCodeIfUse(b2cReq.getAppId(), b2cReq.getWayCode());
        //转化为拉卡拉请求
        LakalaB2CReq lakalaB2CReq = LakalaConvert.toB2CReq(b2cReq);
        if (ObjectUtil.isNull(lakalaB2CReq)) {
            log.error("【F19FC84E3F6F4DE3A722352CE1C99364】-请求参数转化异常，待转化信息:{}", JSONUtil.toJsonStr(b2cReq));
            throw new PayException("支付失败，支付参数转化异常", "F19FC84E3F6F4DE3A722352CE1C99364");
        }
        //获取通道配置信息
        loadConfig(req.getJcMchNo(), req.getAppId());
        LakalaChannelConfig channelConfig = lakalaChannelConfig.get();
        if (ObjectUtil.isNull(channelConfig)) {
            throw new PayException("支付失败，通道配置信息异常", "156419399082403A97F55B34B8397FF6");
        }
        lakalaB2CReq.setNotify_url(lakalaConfig.getNotifyUrl());
        lakalaB2CReq.setMerchant_no(channelConfig.getMerchantNo());
        lakalaB2CReq.setTerm_no(channelConfig.getTermNo());
        LakalaBaseReq lakalaBaseReq = buildBaseReq(channelConfig.getAppId(), lakalaB2CReq);
        String requestJSONBody = JSONUtil.toJsonStr(lakalaBaseReq);
        String authorization = LakalaUtils.getAuthorization(channelConfig.getAppId(), channelConfig.getSerialNo(), requestJSONBody, channelConfig.getPrivateKey());
        //发起请求
        String requestUrl = lakalaConfig.getApiUrl() + UrlConstants.B2C_URL;
        Map<String, String> headers = buildRequestHeader(authorization);
        String response = HttpClientPool.doJsonRequest(requestUrl, requestJSONBody, headers, LakalaUtils.ENCODING);
        log.info("[183b92eb-f3f4-4dfa-9303-791eef83329a]-拉卡拉B2C请求记录，请求地址:{}\n,请求参数:{}\n,请求头信息:{}\n,响应信息:{}\n", requestUrl, requestJSONBody, JSONUtil.toJsonStr(headers), response);
        //转换请求
        LakalaBaseResp lakalaBaseResp = JSON.parseObject(response, LakalaBaseResp.class);
        if (ObjectUtil.isNull(lakalaBaseResp)) {
            log.error("[E67AD0D966784383AFBA5D1BAD4CB5C9]-支付失败，支付响应信息异常，响应信息:{}", response);
            throw new PayException("支付失败，支付响应信息异常", "E67AD0D966784383AFBA5D1BAD4CB5C9");
        }
        if (!PayResultCodeEnum.LAKALA_B2C_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg(), "2F419C7A6E554B378B14C7335F5150BD");
        }

        LakalaB2CResp lakalaB2CResp = JSON.parseObject(JSONUtil.toJsonStr(lakalaBaseResp.getResp_data()), LakalaB2CResp.class);
        if (ObjectUtil.isNull(lakalaB2CResp)) {
            throw new PayException("支付异常", "048D8320C0A745A8B85CF9BBAEED6A11");
        }
        B2CUnifiedOrderResp b2CUnifiedOrderResp = LakalaConvert.toCommonB2CResp(lakalaB2CResp, b2cReq);
        if (ObjectUtil.isNull(b2CUnifiedOrderResp)) {
            throw new PayException("支付异常,转换响应信息异常", "9A4301F493134A5EB876E23137AFD59B");
        }
        b2CUnifiedOrderResp.setReturnCode(lakalaBaseResp.getCode());
        b2CUnifiedOrderResp.setMchNo(req.getMchNo());
        b2CUnifiedOrderResp.setWayCode(((B2CUnifiedOrderReq) req).getWayCode());
        b2CUnifiedOrderResp.setReturnMsg(lakalaBaseResp.getMsg());
        return b2CUnifiedOrderResp;
    }

    @Override
    public C2BUnifiedOrderResp c2bUnifiedOrder(AbstractMchAppReq req) throws Exception {
        if (ObjectUtil.isNull(req)) {
            throw new PayException("请求参数为空", "7AD41B1B46064B479F3F823FD7559621");
        }
        C2BUnifiedOrderReq c2bReq = (C2BUnifiedOrderReq) req;
        // 根据应用id判断支付方式是否可用
        canWayCodeUseHandler.wayCodeIfUse(c2bReq.getAppId(), c2bReq.getWayCode());
        LakalaC2BReq lakalaC2BReq = LakalaConvert.toC2BReq(c2bReq);
        if (ObjectUtil.isNull(lakalaC2BReq)) {
            log.error("【61D2166E68A84138A1DA32516EC3CE15】-请求参数转化异常，待转化信息:{}", JSONUtil.toJsonStr(c2bReq));
            throw new PayException("支付失败，支付参数转化异常", "61D2166E68A84138A1DA32516EC3CE15");
        }
        //获取通道配置信息
        loadConfig(req.getJcMchNo(), req.getAppId());
        LakalaChannelConfig channelConfig = lakalaChannelConfig.get();
        // 缓存加密参数
        c2bReq.setMchNo(channelConfig.getMerchantNoB2B());
        cacheConfigs(c2bReq, c2bReq.getNotifyUrl());
        lakalaC2BReq.setNotify_url(lakalaConfig.getCashierNotifyUrl());
        lakalaC2BReq.setMerchant_no(channelConfig.getMerchantNoB2B());
        lakalaC2BReq.setVpos_id(channelConfig.getVposIdB2B());
        lakalaC2BReq.setTerm_no(channelConfig.getTermNoB2B());
        LakalaBaseReq lakalaBaseReq = buildBaseReq(channelConfig.getAppId(), lakalaC2BReq);
        String requestJSONBody = JSONUtil.toJsonStr(lakalaBaseReq);
        String authorization = LakalaUtils.getAuthorization(channelConfig.getAppId(), channelConfig.getSerialNo(), requestJSONBody, channelConfig.getPrivateKey());
        //发起请求
        String requestUrl = lakalaConfig.getApiUrl() + UrlConstants.C2B_URL;
        Map<String, String> headers = buildRequestHeader(authorization);
        String response = HttpClientPool.doJsonRequest(requestUrl, requestJSONBody, headers, LakalaUtils.ENCODING);
        log.info("[618B30D886B24949BC1E14BBCC60E7E4]-拉卡拉C2B请求记录，\n请求地址:{},\n请求参数:{},\n请求头信息:{},\n响应信息:{}", requestUrl, requestJSONBody, JSONUtil.toJsonStr(headers), response);
        //转换请求
        C2BUnifiedOrderResp c2BUnifiedOrderResp = null;
        LakalaBaseResp lakalaBaseResp = JSON.parseObject(response, LakalaBaseResp.class);
        if (ObjectUtil.isNull(lakalaBaseResp)) {
            log.error("[b3e5abda-af0b-4dd1-84e6-0874dbf6efc5]-支付失败，支付响应信息异常，响应信息:{}", response);
            throw new PayException("支付失败，支付响应信息异常");
        }
        if (!PayResultCodeEnum.LAKALA_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg());
        }
        LakalaC2BResp lakalaC2BResp = JSON.parseObject(JSONUtil.toJsonStr(lakalaBaseResp.getResp_data()), LakalaC2BResp.class);
        if (ObjectUtil.isNull(lakalaC2BResp)) {
            throw new PayException("响应信息转化异常", "6662513158B64BF9AB52B8EAEB751FC4");
        }
        c2BUnifiedOrderResp = LakalaConvert.toCommonC2BResp(lakalaC2BResp);
        c2BUnifiedOrderResp.setReturnCode(lakalaBaseResp.getCode());
        c2BUnifiedOrderResp.setMchNo(req.getMchNo());
        c2BUnifiedOrderResp.setWayCode(((C2BUnifiedOrderReq) req).getWayCode());
        c2BUnifiedOrderResp.setReturnMsg(lakalaBaseResp.getMsg());
        return c2BUnifiedOrderResp;
    }

    @Override
    public UnifiedOrderResp unifiedOrder(AbstractMchAppReq req) throws Exception {
        if (ObjectUtil.isNull(req)) {
            throw new PayException("请求参数为空", "733F1E6C4A964A36B99EE8ADE88BC49B");
        }
        UnifiedOrderReq uniReq = (UnifiedOrderReq) req;
        Optional<LakalaUnifiedOrderReq> orderReqOptional = LakalaConvert.toUnifiedOrderReq(uniReq);
        if (!orderReqOptional.isPresent()) {
            throw new PayException("请求参数转换异常", "333DECF312624C01AC29128F63A46390");
        }
        //获取通道配置信息
        loadConfig(req.getJcMchNo(), req.getAppId());
        // 缓存加密参数
        cacheConfigs(uniReq, uniReq.getNotifyUrl());
        LakalaChannelConfig channelConfig = lakalaChannelConfig.get();
        LakalaUnifiedOrderReq unifiedOrderReq = orderReqOptional.get();
        unifiedOrderReq.setMerchant_no(channelConfig.getMerchantNo());
        unifiedOrderReq.setTerm_no(channelConfig.getTermNo());
        unifiedOrderReq.setNotify_url(lakalaConfig.getNotifyUrl());
        LakalaBaseReq lakalaBaseReq = buildBaseReq(channelConfig.getAppId(), unifiedOrderReq);
        String requestJSONBody = JSONUtil.toJsonStr(lakalaBaseReq);
        String authorization = LakalaUtils.getAuthorization(channelConfig.getAppId(), channelConfig.getSerialNo(), requestJSONBody, channelConfig.getPrivateKey());
        //发起请求
        String requestUrl = lakalaConfig.getApiUrl() + UrlConstants.UNIFIED_URL;
        Map<String, String> headers = buildRequestHeader(authorization);
        String response = HttpClientPool.doJsonRequest(requestUrl, requestJSONBody, headers, LakalaUtils.ENCODING);
        log.info("[61D5B67919C84352ABB6B48461DEDB2F]-拉卡拉统一下单请求记录，\n请求地址:{},\n请求参数:{},\n请求头信息:{},\n响应信息:{}", requestUrl, requestJSONBody, JSONUtil.toJsonStr(headers), response);
        //转换请求
        LakalaBaseResp lakalaBaseResp = JSON.parseObject(response, LakalaBaseResp.class);
        if (ObjectUtil.isNull(lakalaBaseResp)) {
            log.error("[D127C898072F492DB77D0B9CE8D78476]-支付失败，支付响应信息异常，响应信息:{}", response);
            throw new PayException("支付失败，支付响应信息异常");
        }
        if (!PayResultCodeEnum.LAKALA_UNIFIED_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg(), "BC1ABF70AAF14801BF7A9422D03CBFB7");
        }
        LakalaUnifiedOrderResp lakalaUnifiedOrderResp = JSON.parseObject(JSONUtil.toJsonStr(lakalaBaseResp.getResp_data()), LakalaUnifiedOrderResp.class);

        if (!PayResultCodeEnum.LAKALA_UNIFIED_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg());
        }

        UnifiedOrderResp unifiedOrderResp = LakalaConvert.toUnifiedOrderResp(lakalaUnifiedOrderResp);
        if (ObjectUtil.isNull(unifiedOrderResp)) {
            throw new PayException("响应信息转化异常", "EFE0521529C443C7ACD4A17E1C039BFE");
        }
        unifiedOrderResp.setReturnCode(SUCCESS.getResultCode());
        unifiedOrderResp.setMchNo(req.getMchNo());
        unifiedOrderResp.setDealDate(lakalaBaseResp.getResp_time());
        unifiedOrderResp.setReturnMsg(lakalaBaseResp.getMsg());
        return unifiedOrderResp;
    }

    @Override
    public Auth2OpenIdResp auth2OpenId(AbstractMchAppReq req) throws Exception {
        return null;
    }

    @Override
    public QueryOrderResp queryOrder(AbstractMchAppReq req) throws Exception {
        if (ObjectUtil.isNull(req)) {
            throw new PayException("请求参数为空", "8869AF38B9B046C4A7FC1E112E8832B6");
        }
        QueryOrderReq queryOrderReq = (QueryOrderReq) req;
        PaySceneEnum paySceneEnum = PaySceneEnum.of(queryOrderReq.getPaySceneCode());
        LakalaQueryOrderReq lakalaQueryOrderReq = LakalaConvert.toQueryOrderReq(queryOrderReq);
        //获取通道配置信息
        loadConfig(req.getJcMchNo(), req.getAppId());
        switch (Objects.requireNonNull(paySceneEnum)) {
            case B2C_PAY:
            case UNIFIED_PAY:
                return commonQueryOrder(lakalaQueryOrderReq);
            case C2B_PAY:
                return cashierQueryOrder(lakalaQueryOrderReq);
            default:
                return null;
        }
    }

    /**
     * B2C&&聚合支付查询
     *
     * @param lakalaQueryOrderReq
     * @return
     */
    private QueryOrderResp commonQueryOrder(LakalaQueryOrderReq lakalaQueryOrderReq) throws Exception {
        LakalaChannelConfig channelConfig = lakalaChannelConfig.get();
        lakalaQueryOrderReq.setMerchant_no(channelConfig.getMerchantNo());
        lakalaQueryOrderReq.setTerm_no(channelConfig.getTermNo());
        LakalaBaseReq lakalaBaseReq = buildBaseReq(channelConfig.getAppId(), lakalaQueryOrderReq);
        String requestJSONBody = JSONUtil.toJsonStr(lakalaBaseReq);
        String authorization = LakalaUtils.getAuthorization(channelConfig.getAppId(), channelConfig.getSerialNo(), requestJSONBody, channelConfig.getPrivateKey());
        //发起请求
        String requestUrl = lakalaConfig.getApiUrl() + UrlConstants.COMMON_QUERY_ORDER_URL;
        Map<String, String> headers = buildRequestHeader(authorization);
        String response = HttpClientPool.doJsonRequest(requestUrl, requestJSONBody, headers, LakalaUtils.ENCODING);
        log.info("[32c4131e-97b7-4401-a6eb-1f31cd90a986]-拉卡拉普通订单查询请求记录，\n请求地址:{},\n请求参数:{},\n请求头信息:{},\n响应信息:{}", requestUrl, requestJSONBody, JSONUtil.toJsonStr(headers), response);
        //转换请求
        LakalaBaseResp lakalaBaseResp = JSON.parseObject(response, LakalaBaseResp.class);
        if (ObjectUtil.isNull(lakalaBaseResp)) {
            log.error("[d2b5ff20-f9c3-4045-8ccc-d7fd5af19dd8]-请求退款失败，无法转换响应信息，响应信息:{}", response);
            throw new PayException("支付失败，支付响应信息异常");
        }
        if (!PayResultCodeEnum.LAKALA_QUERY_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg());
        }
        LakalaCommonOrderResp orderResp = JSONUtil.toBean(JSONUtil.toJsonStr(lakalaBaseResp.getResp_data()), LakalaCommonOrderResp.class);
        QueryOrderResp queryOrderResp = LakalaConvert.toQueryOrderResp(orderResp);
        queryOrderResp.setReturnCode(lakalaBaseResp.getCode());
        queryOrderResp.setReturnMsg(lakalaBaseResp.getMsg());
        return queryOrderResp;
    }

    /**
     * 收银台订单查询
     *
     * @param lakalaQueryOrderReq
     * @return
     */
    private QueryOrderResp cashierQueryOrder(LakalaQueryOrderReq lakalaQueryOrderReq) throws Exception {
        LakalaChannelConfig channelConfig = lakalaChannelConfig.get();
        lakalaQueryOrderReq.setMerchant_no(channelConfig.getMerchantNoB2B());
        lakalaQueryOrderReq.setTerm_no(channelConfig.getTermNoB2B());
        LakalaBaseReq lakalaBaseReq = buildBaseReq(channelConfig.getAppId(), lakalaQueryOrderReq);
        String requestJSONBody = JSONUtil.toJsonStr(lakalaBaseReq);
        String authorization = LakalaUtils.getAuthorization(channelConfig.getAppId(), channelConfig.getSerialNo(), requestJSONBody, channelConfig.getPrivateKey());
        //发起请求
        String requestUrl = lakalaConfig.getApiUrl() + UrlConstants.CASHIER_QUERY_ORDER_URL;
        Map<String, String> headers = buildRequestHeader(authorization);
        String response = HttpClientPool.doJsonRequest(requestUrl, requestJSONBody, headers, LakalaUtils.ENCODING);
        log.info("[32c4131e-97b7-4401-a6eb-1f31cd90a986]-拉卡拉收银台订单查询请求记录，\n请求地址:{},\n请求参数:{},\n请求头信息:{},\n响应信息:{}", requestUrl, requestJSONBody, JSONUtil.toJsonStr(headers), response);
        //转换请求
        LakalaBaseResp lakalaBaseResp = JSON.parseObject(response, LakalaBaseResp.class);
        if (ObjectUtil.isNull(lakalaBaseResp)) {
            log.error("[d2b5ff20-f9c3-4045-8ccc-d7fd5af19dd8]-请求退款失败，无法转换响应信息，响应信息:{}", response);
            throw new PayException("支付失败，支付响应信息异常");
        }
        if (!PayResultCodeEnum.LAKALA_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg());
        }
        LakalaCashierOrderResp orderResp = JSONUtil.toBean(JSONUtil.toJsonStr(lakalaBaseResp.getResp_data()), LakalaCashierOrderResp.class);
        QueryOrderResp queryOrderResp = LakalaConvert.toQueryOrderResp(orderResp);
        queryOrderResp.setReturnCode(lakalaBaseResp.getCode());
        queryOrderResp.setReturnMsg(lakalaBaseResp.getMsg());
        return queryOrderResp;
    }


    @Override
    public RefundOrderResp refundOrder(AbstractMchAppReq req) throws Exception {
        RefundOrderReq refundOrderReq = (RefundOrderReq) req;
        String wayCode = WayCodeEnum.getPayWay(refundOrderReq.getWayCode());
        LakalaRefundReq lakalaRefundReq = LakalaConvert.toRefundReq(refundOrderReq);
        //获取通道配置信息
        loadConfig(req.getJcMchNo(), req.getAppId());
        //加签
        LakalaChannelConfig channelConfig = lakalaChannelConfig.get();
        lakalaRefundReq.setMerchant_no(channelConfig.getMerchantNo());
        lakalaRefundReq.setTerm_no(channelConfig.getTermNo());
        if (PaySceneEnum.C2B_PAY.equals(PaySceneEnum.of(refundOrderReq.getReqFrom()))) {
            lakalaRefundReq.setMerchant_no(channelConfig.getMerchantNoB2B());
            lakalaRefundReq.setTerm_no(channelConfig.getTermNoB2B());
        }
        LakalaBaseReq lakalaBaseReq = buildBaseReq(channelConfig.getAppId(), lakalaRefundReq);
        String requestJSONBody = JSONUtil.toJsonStr(lakalaBaseReq);
        String authorization = LakalaUtils.getAuthorization(channelConfig.getAppId(), channelConfig.getSerialNo(), requestJSONBody, channelConfig.getPrivateKey());
        //发起请求
        String requestUrl = lakalaConfig.getApiUrl() + UrlConstants.REFUND_URL;
        Map<String, String> headers = buildRequestHeader(authorization);
        String response = HttpClientPool.doJsonRequest(requestUrl, requestJSONBody, headers, LakalaUtils.ENCODING);
        log.info("[32c4131e-97b7-4401-a6eb-1f31cd90a986]-拉卡拉Refund请求记录，\n请求地址:{},\n请求参数:{},\n请求头信息:{},\n响应信息:{}", requestUrl, requestJSONBody, JSONUtil.toJsonStr(headers), response);
        //转换请求
        LakalaBaseResp lakalaBaseResp = JSON.parseObject(response, LakalaBaseResp.class);
        if (ObjectUtil.isNull(lakalaBaseResp)) {
            log.error("[d2b5ff20-f9c3-4045-8ccc-d7fd5af19dd8]-请求退款失败，无法转换响应信息，响应信息:{}", response);
            throw new PayException("支付失败，支付响应信息异常");
        }
        if (!PayResultCodeEnum.LAKALA_C2B_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg());
        }
        LakalaRefundResp lakalaRefundResp = JSONUtil.toBean(JSONUtil.toJsonStr(lakalaBaseResp.getResp_data()), LakalaRefundResp.class);
        if (ObjectUtil.isNull(lakalaRefundResp)) {
            throw new PayException("转换响应信息异常", "8E5720656D754745A5CF02D158AFF2CC");
        }
        RefundOrderResp resp = LakalaUtils.toRefundQueryResp(refundOrderReq, lakalaRefundResp);
        if (ObjectUtil.isNull(resp)) {
            throw new PayException("转换响应信息异常", "8E5720656D754745A5CF02D158AFF2CC");
        }
        resp.setReturnCode(lakalaBaseResp.getCode());
        resp.setReturnMsg(lakalaBaseResp.getMsg());
        return resp;
    }

    @Override
    public CloseOrderResp closeOrder(AbstractMchAppReq req) throws Exception {
        CloseOrderReq closeReq = (CloseOrderReq) req;
        LakalaCloseOrderReq closeOrderResp = LakalaConvert.toCloseReq(closeReq);
        if (!PaySceneEnum.UNIFIED_PAY.equals(PaySceneEnum.of(closeReq.getReqFrom()))) {
            throw new PayException("关单交易只能对主扫支付场景下，未完成的支付交易进行关单", "75B8C4AA6E094EB1A7D4F24061F1A4B8");
        }
        //获取通道配置信息
        loadConfig(req.getJcMchNo(), req.getAppId());
        //加签
        LakalaChannelConfig channelConfig = lakalaChannelConfig.get();
        closeOrderResp.setMerchant_no(channelConfig.getMerchantNo());
        closeOrderResp.setTerm_no(channelConfig.getTermNo());
        LakalaBaseReq lakalaBaseReq = buildBaseReq(channelConfig.getAppId(), closeOrderResp);
        String requestJSONBody = JSONUtil.toJsonStr(lakalaBaseReq);
        String authorization = LakalaUtils.getAuthorization(channelConfig.getAppId(), channelConfig.getSerialNo(), requestJSONBody, channelConfig.getPrivateKey());
        //发起请求
        String requestUrl = lakalaConfig.getApiUrl() + UrlConstants.CLOSE_ORDER_URL;
        Map<String, String> headers = buildRequestHeader(authorization);
        String response = HttpClientPool.doJsonRequest(requestUrl, requestJSONBody, headers, LakalaUtils.ENCODING);
        log.info("[32c4131e-97b7-4401-a6eb-1f31cd90a986]-拉卡拉Refund请求记录，\n请求地址:{},\n请求参数:{},\n请求头信息:{},\n响应信息:{}", requestUrl, requestJSONBody, JSONUtil.toJsonStr(headers), response);
        //转换请求
        LakalaBaseResp lakalaBaseResp = JSON.parseObject(response, LakalaBaseResp.class);
        if (ObjectUtil.isNull(lakalaBaseResp)) {
            log.error("[9265B2DF0AC34E34920BA4E449B26A1A]-请求关单失败，无法转换响应信息，响应信息:{}", response);
            throw new PayException("关单失败，处理响应信息异常", "9265B2DF0AC34E34920BA4E449B26A1A");
        }
        if (!PayResultCodeEnum.LAKALA_CLOSE_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg(), "4421974B74184CED9DBC98B39711C44C");
        }
        LakalaCloseOrderResp lakalaCloseOrderResp = JSONUtil.toBean(JSONUtil.toJsonStr(lakalaBaseResp.getResp_data()), LakalaCloseOrderResp.class);
        if (ObjectUtil.isNull(lakalaCloseOrderResp)) {
            throw new PayException("转换响应信息异常", "ECEEE29E1DDD4EEC895E82E7D876F82D");
        }
        CloseOrderResp resp = LakalaUtils.toCloseOrderResp((CloseOrderReq) req, lakalaCloseOrderResp);
        if (ObjectUtil.isNull(resp)) {
            throw new PayException("转换响应信息异常", "F76204AF80604763B377262E8FC58B82");
        }
        resp.setReturnCode(lakalaBaseResp.getCode());
        resp.setReturnMsg(lakalaBaseResp.getMsg());
        return resp;
    }

    @Override
    public CancelOrderResp cancelOrder(AbstractMchAppReq req) throws Exception {
        CancelOrderReq cancelOrderReq = (CancelOrderReq) req;
        LakalaRevokeOrderReq revokeOrderReq = LakalaConvert.toRevokeReq(cancelOrderReq);
        if (!PaySceneEnum.B2C_PAY.equals(PaySceneEnum.of(cancelOrderReq.getReqFrom()))) {
            throw new PayException("撤销交易只能对被扫支付场景下，已完成的支付交易进行操作", "4D425304015E454FABF16A099DFCB54F");
        }
        //获取通道配置信息
        loadConfig(req.getJcMchNo(), req.getAppId());
        //加签
        LakalaChannelConfig channelConfig = lakalaChannelConfig.get();
        revokeOrderReq.setMerchant_no(channelConfig.getMerchantNo());
        revokeOrderReq.setTerm_no(channelConfig.getTermNo());
        LakalaBaseReq lakalaBaseReq = buildBaseReq(channelConfig.getAppId(), revokeOrderReq);
        String requestJSONBody = JSONUtil.toJsonStr(lakalaBaseReq);
        String authorization = LakalaUtils.getAuthorization(channelConfig.getAppId(), channelConfig.getSerialNo(), requestJSONBody, channelConfig.getPrivateKey());
        //发起请求
        String requestUrl = lakalaConfig.getApiUrl() + UrlConstants.REVOKED_ORDER_URL;
        Map<String, String> headers = buildRequestHeader(authorization);
        String response = HttpClientPool.doJsonRequest(requestUrl, requestJSONBody, headers, LakalaUtils.ENCODING);
        log.info("[A1917C77EEB74FB480F5A2EA55B4C70F]-拉卡拉Refund请求记录，\n请求地址:{},\n请求参数:{},\n请求头信息:{},\n响应信息:{}", requestUrl, requestJSONBody, JSONUtil.toJsonStr(headers), response);
        //转换请求
        LakalaBaseResp lakalaBaseResp = JSON.parseObject(response, LakalaBaseResp.class);
        if (ObjectUtil.isNull(lakalaBaseResp)) {
            log.error("[A45FE7E12420400CB0FC13B19E234D92]-请求关单失败，无法转换响应信息，响应信息:{}", response);
            throw new PayException("撤销失败，处理响应信息异常", "A45FE7E12420400CB0FC13B19E234D92");
        }
        if (!PayResultCodeEnum.LAKALA_REVOKE_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg(), "50217C3B9FD8421798AE9FCDF5FAEA5B");
        }
        LakalaCancelOrderResp resp = JSONUtil.toBean(JSONUtil.toJsonStr(lakalaBaseResp.getResp_data()), LakalaCancelOrderResp.class);
        CancelOrderResp refundQueryResp = LakalaConvert.toCancelOrderResp(resp, (CancelOrderReq) req);
        refundQueryResp.setReturnCode(lakalaBaseResp.getCode());
        refundQueryResp.setReturnMsg(lakalaBaseResp.getMsg());
        return refundQueryResp;
    }

    @Override
    public RefundQueryResp refundQuery(AbstractMchAppReq req) throws Exception {
        LakalaRefundQueryReq lakalaRefundQueryReq = LakalaUtils.toRefundQueryReq((RefundQueryReq) req);
        //获取通道配置信息
        loadConfig(req.getJcMchNo(), req.getAppId());
        //加签
        LakalaChannelConfig channelConfig = lakalaChannelConfig.get();
        lakalaRefundQueryReq.setMerchant_no(channelConfig.getMerchantNo());
        lakalaRefundQueryReq.setTerm_no(channelConfig.getTermNo());
        LakalaBaseReq lakalaBaseReq = buildBaseReq(channelConfig.getAppId(), lakalaRefundQueryReq);
        String requestJSONBody = JSONUtil.toJsonStr(lakalaBaseReq);
        String authorization = LakalaUtils.getAuthorization(channelConfig.getAppId(), channelConfig.getSerialNo(), requestJSONBody, channelConfig.getPrivateKey());
        //发起请求
        String requestUrl = lakalaConfig.getApiUrl() + UrlConstants.REVOKED_ORDER_URL;
        Map<String, String> headers = buildRequestHeader(authorization);
        String response = HttpClientPool.doJsonRequest(requestUrl, requestJSONBody, headers, LakalaUtils.ENCODING);
        log.info("[96536636F31F4AEEAA16EB1634377EB7]-拉卡拉Refund请求记录，\n请求地址:{},\n请求参数:{},\n请求头信息:{},\n响应信息:{}", requestUrl, requestJSONBody, JSONUtil.toJsonStr(headers), response);
        //转换请求
        LakalaBaseResp lakalaBaseResp = JSON.parseObject(response, LakalaBaseResp.class);
        if (ObjectUtil.isNull(lakalaBaseResp)) {
            log.error("[956BCC6052AC4662B61DB81F07A6514D]-退款订单查询失败，无法转换响应信息，响应信息:{}", response);
            throw new PayException("退款订单查询失败，处理响应信息异常", "956BCC6052AC4662B61DB81F07A6514D");
        }
        if (!PayResultCodeEnum.LAKALA_SUCCESS.getResultCode().equals(lakalaBaseResp.getCode())) {
            throw new PayException(lakalaBaseResp.getMsg(), "7D0995E18602417CAC1813C8290E098F");
        }
        LakalaRefundQueryResp queryResp = JSONUtil.toBean(JSONUtil.toJsonStr(lakalaBaseResp.getResp_data()), LakalaRefundQueryResp.class);
        RefundQueryResp refundQueryResp = LakalaConvert.toRefundQueryResp(queryResp);
        refundQueryResp.setReturnCode(lakalaBaseResp.getCode());
        refundQueryResp.setReturnMsg(lakalaBaseResp.getMsg());
        return refundQueryResp;
    }

    @Override
    public boolean payForBack(Map map) throws Exception {
        return false;
    }


    /**
     * 验证签名
     *
     * @param authorization 验证Token
     * @param channelMchNo  通道商户ID
     * @param body          请求数据
     * @return
     */
    public boolean verify(String authorization, String channelMchNo, String body) throws Exception {
        //获取商户配置信息
        JSONObject json = redisService.getCacheObject(CacheConstants.CONFIG_PARAMS + channelMchNo);
        if (ObjectUtil.isNull(json)) {
            throw new PayException("支付参数未取到", "8492AC1458C3404E8B8456F124D4FA61");
        }
        String apiGwCert = json.getString("apiGwCert");
        X509Certificate x509Certificate = LakalaUtils.loadCertificate(new ByteArrayInputStream(apiGwCert.getBytes("utf-8")));
        LakalaAuthData lakalaAuthData = LakalaUtils.splitAuthData(authorization);
        if (ObjectUtil.isNull(lakalaAuthData)) {
            log.error("[0bcf6732-b3ea-475c-b2e6-0efe07a95034]-回调签名信息解析异常，响应信息:{}", authorization);
            throw new PayException("回调签名信息解析异常");
        }
        String message = lakalaAuthData.getTimestamp() + "\n" + lakalaAuthData.getNonce_str() + "\n" + body + "\n";
        return LakalaUtils.verify(x509Certificate, message.getBytes(LakalaUtils.ENCODING), lakalaAuthData.getSignature());
    }

    /**
     * 聚合支付回调处理
     *
     * @param req
     * @return
     */
    public boolean commonCallBack(LakalaCommonCallbackReq req) throws Exception {
        if (ObjectUtil.isNull(req)) {
            throw new PayException("无法转换请求信息", "7F8D3F8C02024820A88785FDA678223B");
        }
        // 订单状态修改
        SetOrderStatusCommand setOrderStatusCommand = new SetOrderStatusCommand();
        setOrderStatusCommand.setMchOrderId(req.getOut_trade_no());
        setOrderStatusCommand.setChannelOrderNo(req.getTrade_no());
        //保存通道响应报文到ES中
        try {
            UpdateESOrderInfoCommand updateESOrderInfoCommand = new UpdateESOrderInfoCommand();
            updateESOrderInfoCommand.setOrderNo(req.getOut_trade_no());
            updateESOrderInfoCommand.setPayNotifyBody(JSONUtil.toJsonStr(req));
            updateESOrderInfoCommand.setIsCreate(false);
            Message<UpdateESOrderInfoCommand> message = MessageBuilder.withPayload(updateESOrderInfoCommand).setHeader("KEYS", UUID.fastUUID()).setHeader("authUser", SecurityUtils.getUserId()).build();
            rocketMQTemplate.asyncSend(orderlyMessageDestination, message, new SendCallback() {
                @Override
                public void onSuccess(SendResult sendResult) {
                    log.info("save lakala common Notify resp to es message send successful");
                }

                @Override
                public void onException(Throwable throwable) {
                    log.info("save  lakala common  Notify resp to es message send fail; {}", throwable.getMessage());
                }
            }, 30000L);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return false;
        }

        if (LakalaTraceStatus.SUCCESS.equals(LakalaTraceStatus.of(req.getTrade_status()))) {
            setOrderStatusCommand.setStatus(Integer.valueOf(OrderStatusEnum.PAY_SUCCESS.getCode()));
            remoteOrderService.setOrderStatus(setOrderStatusCommand, SecurityConstants.INNER);
            //订单支付成功，准备进行收款播报
            R<JcPayOrder> orderInfo = remoteOrderService.getOrderInfo(req.getOut_trade_no(), SecurityConstants.INNER);
            playVoiceNotifyHandler.handler(orderInfo.getData());
        }
        //执行异步回调
        PayCallBackResp payCallBackResp = LakalaConvert.commonCallBack(req);
        return notifyCallBack(req.getOut_trade_no(), payCallBackResp);
    }

    /**
     * 收银台回调处理
     *
     * @param req
     * @return
     */
    public boolean cashierCallBack(LakalaCashierCallbackReq req) throws Exception {
        if (ObjectUtil.isNull(req)) {
            throw new PayException("无法转换请求信息", "7F8D3F8C02024820A88785FDA678223B");
        }
        // 订单状态修改
        SetOrderStatusCommand setOrderStatusCommand = new SetOrderStatusCommand();
        setOrderStatusCommand.setMchOrderId(req.getOut_order_no());
        setOrderStatusCommand.setChannelOrderNo(req.getOrder_trade_info().getTrade_no());
        //保存通道响应报文到ES中
        try {
            UpdateESOrderInfoCommand updateESOrderInfoCommand = new UpdateESOrderInfoCommand();
            updateESOrderInfoCommand.setOrderNo(req.getOut_order_no());
            updateESOrderInfoCommand.setPayNotifyBody(JSONUtil.toJsonStr(req));
            updateESOrderInfoCommand.setIsCreate(false);
            Message<UpdateESOrderInfoCommand> message = MessageBuilder.withPayload(updateESOrderInfoCommand).setHeader("KEYS", UUID.fastUUID()).setHeader("authUser", SecurityUtils.getUserId()).build();
            rocketMQTemplate.asyncSend(orderlyMessageDestination, message, new SendCallback() {
                @Override
                public void onSuccess(SendResult sendResult) {
                    log.info("save lakala common Notify resp to es message send successful");
                }

                @Override
                public void onException(Throwable throwable) {
                    log.info("save  lakala common  Notify resp to es message send fail; {}", throwable.getMessage());
                }
            }, 30000L);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return false;
        }

        if (LakalaCashierTraceStatus.PAY_SUCCESS.equals(LakalaCashierTraceStatus.of(req.getOrder_status()))) {
            setOrderStatusCommand.setStatus(Integer.valueOf(OrderStatusEnum.PAY_SUCCESS.getCode()));
            remoteOrderService.setOrderStatus(setOrderStatusCommand, SecurityConstants.INNER);
            //订单支付成功，准备进行收款播报
            R<JcPayOrder> orderInfo = remoteOrderService.getOrderInfo(req.getOut_order_no(), SecurityConstants.INNER);
            playVoiceNotifyHandler.handler(orderInfo.getData());
        }
        //执行异步回调
        PayCallBackResp payCallBackResp = LakalaConvert.cashierCallback(req);
        return notifyCallBack(req.getOut_order_no(), payCallBackResp);
    }


    private boolean notifyCallBack(String mchOrderNo, PayCallBackResp payCallBackResp) throws Exception {
        // 异步回调请求方url
        String notifyUrl = redisService.getCacheObject(CacheConstants.NOTIFY_URL + mchOrderNo);
        String orgId = redisService.getCacheObject(CacheConstants.ORG_ID + payCallBackResp.getOrgId());
        String mchKey = redisService.getCacheObject(CacheConstants.MD5_KEY + payCallBackResp.getOrgId());

        payCallBackResp.setMchOrderNo(mchOrderNo)
                // 将商户号转换为对应的通道商户号
                .setMchNo(mchOrderNo)
                // 将巨彩机构号转换为对应的通道机构号
                .setOrgId(orgId);
        Map map = JSON.parseObject(JSON.toJSONString(payCallBackResp), Map.class);
        String sign = Md5Utils.getSign(map, mchKey);
        payCallBackResp.setSign(sign);
        String rest;
        try {
            rest = HttpUtil.post(notifyUrl, JSON.toJSONString(payCallBackResp));
            log.info("[11E6A5604A894A86853D492673BB84F0]-回调请求返回：{}", rest);
        } catch (Exception e) {
            log.error("[5BEDB077028142CD8A6BCEB22D326561]-回调失败：{}", e.getMessage());
            return false;
        }
        if (Objects.equals(SUCCESS, rest)) {
            return true;
        }
        return false;
    }
}
`


function escapeTemplateString(templateString:string)  { return templateString.replace(/\$/g, '\\$'); }

</script>


<style scoped>

</style>