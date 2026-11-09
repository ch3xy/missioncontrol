package com.ch3xy.missioncontrol.app;

import com.ch3xy.missioncontrol.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The "local" profile allows the dev origins (Angular dev server, Swagger UI) and nothing else. */
@ActiveProfiles("local")
class LocalProfileAccessIntegrationTest extends AbstractIntegrationTest {

    @Autowired WebApplicationContext context;
    @Autowired AccessGuardFilter guard;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(guard).build();
    }

    @Test
    void swaggerUiOriginIsAllowed() throws Exception {
        mvc.perform(get("/api/v1/health")
                        .header("Host", "localhost:8082")
                        .header("Origin", "http://localhost:8082"))
                .andExpect(status().isOk());
    }

    @Test
    void angularDevServerOriginIsAllowedAndGetsCorsHeaders() throws Exception {
        mvc.perform(get("/api/v1/health")
                        .header("Host", "localhost:8082")
                        .header("Origin", "http://localhost:4200"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));
    }

    @Test
    void otherOriginsAreStillRejected() throws Exception {
        mvc.perform(get("/api/v1/health")
                        .header("Host", "localhost:8082")
                        .header("Origin", "https://evil.example"))
                .andExpect(status().isForbidden());
    }
}
