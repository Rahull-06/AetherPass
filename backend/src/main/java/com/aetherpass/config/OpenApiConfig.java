package com.aetherpass.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI aetherPassOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AetherPass API")
                        .description("Enterprise Event Ticket Booking & Management Platform")
                        .version("v1")
                        .contact(new Contact().name("AetherPass").email("support@aetherpass.dev")));
    }
}
