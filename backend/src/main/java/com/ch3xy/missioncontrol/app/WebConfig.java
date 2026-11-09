package com.ch3xy.missioncontrol.app;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final List<String> allowedOrigins;
    private final List<String> allowedHosts;

    public WebConfig(@Value("${app.access.allowed-origins:}") List<String> allowedOrigins,
                     @Value("${app.access.allowed-hosts:}") List<String> allowedHosts) {
        this.allowedOrigins = allowedOrigins;
        this.allowedHosts = allowedHosts;
    }

    @Bean
    AccessPolicy accessPolicy() {
        return new AccessPolicy(allowedHosts, allowedOrigins);
    }

    /** Same list as the origin check, so a direct dev setup (4200 to 8082) works without a proxy. */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOrigins.stream().map(String::trim).filter(o -> !o.isEmpty()).toArray(String[]::new);
        if (origins.length == 0) {
            return;
        }
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
