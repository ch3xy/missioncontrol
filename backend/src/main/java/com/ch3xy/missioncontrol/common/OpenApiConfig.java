package com.ch3xy.missioncontrol.common;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata. The spec is served at /v3/api-docs, the UI at /swagger-ui/index.html.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI missionControlOpenApi() {
        return new OpenAPI().info(new Info()
                .title("mission control API")
                .description("Cockpit der Arrow-Produkte: Einstellungen, Kalender-Sync und Tagesplan für eine Person")
                .version("v1"));
    }
}
