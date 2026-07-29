package com.aetherpass.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String EXCHANGE = "aetherpass.events";
    public static final String BOOKING_CONFIRMED_QUEUE = "aetherpass.booking.confirmed";
    public static final String BOOKING_CANCELLED_QUEUE = "aetherpass.booking.cancelled";
    public static final String RK_BOOKING_CONFIRMED = "booking.confirmed";
    public static final String RK_BOOKING_CANCELLED = "booking.cancelled";

    @Bean
    public TopicExchange aetherpassExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue bookingConfirmedQueue() {
        return new Queue(BOOKING_CONFIRMED_QUEUE, true);
    }

    @Bean
    public Queue bookingCancelledQueue() {
        return new Queue(BOOKING_CANCELLED_QUEUE, true);
    }

    @Bean
    public Binding bookingConfirmedBinding(Queue bookingConfirmedQueue, TopicExchange aetherpassExchange) {
        return BindingBuilder.bind(bookingConfirmedQueue).to(aetherpassExchange).with(RK_BOOKING_CONFIRMED);
    }

    @Bean
    public Binding bookingCancelledBinding(Queue bookingCancelledQueue, TopicExchange aetherpassExchange) {
        return BindingBuilder.bind(bookingCancelledQueue).to(aetherpassExchange).with(RK_BOOKING_CANCELLED);
    }

    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jacksonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jacksonMessageConverter);
        return template;
    }
}
