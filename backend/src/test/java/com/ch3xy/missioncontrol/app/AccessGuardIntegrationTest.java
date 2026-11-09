package com.ch3xy.missioncontrol.app;

import com.ch3xy.missioncontrol.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = "app.access.allowed-origins=https://mc.test")
class AccessGuardIntegrationTest extends AbstractIntegrationTest {

    @Autowired WebApplicationContext context;
    @Autowired AccessGuardFilter guard;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(guard).build();
    }

    @Test
    void healthIsServedForAllowedHost() throws Exception {
        mvc.perform(get("/api/v1/health").header("Host", "mc.test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void healthIsServedOnLoopbackForContainerChecks() throws Exception {
        mvc.perform(get("/api/v1/health").header("Host", "localhost:8082"))
                .andExpect(status().isOk());
    }

    @Test
    void rebindingHostIsRejected() throws Exception {
        mvc.perform(get("/api/v1/settings").header("Host", "evil.example"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Host not allowed"));
    }

    @Test
    void foreignOriginCannotChangeSettings() throws Exception {
        mvc.perform(put("/api/v1/settings")
                        .header("Host", "mc.test")
                        .header("Origin", "https://evil.example")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Origin not allowed"));
    }

    @Test
    void ownOriginPassesTheGuard() throws Exception {
        mvc.perform(get("/api/v1/settings")
                        .header("Host", "mc.test")
                        .header("Origin", "https://mc.test"))
                .andExpect(status().isOk());
    }

    @Test
    void devOriginIsRejectedWithoutTheLocalProfile() throws Exception {
        mvc.perform(get("/api/v1/settings")
                        .header("Host", "mc.test")
                        .header("Origin", "http://localhost:4200"))
                .andExpect(status().isForbidden());
    }
}
