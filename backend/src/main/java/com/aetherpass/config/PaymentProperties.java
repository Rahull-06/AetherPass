package com.aetherpass.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "aetherpass.payments")
public class PaymentProperties {

    /** MOCK for local demo without Razorpay keys; RAZORPAY for real checkout. */
    private String provider = "MOCK";
    private String razorpayKeyId = "";
    private String razorpayKeySecret = "";
    private String razorpayWebhookSecret = "";
}
