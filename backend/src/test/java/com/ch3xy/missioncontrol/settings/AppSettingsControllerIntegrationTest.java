package com.ch3xy.missioncontrol.settings;

import com.ch3xy.missioncontrol.AbstractIntegrationTest;
import com.ch3xy.missioncontrol.app.AccessGuardFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AppSettingsControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired WebApplicationContext context;
    @Autowired AccessGuardFilter guard;
    @Autowired AppSettingsService service;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(guard).build();
    }

    @AfterEach
    void reset() {
        service.update(AppSettingsServiceIntegrationTest.valid());
    }

    private static final String BODY = """
            {"veloUrl":"https://arrow.local/velo","dashUrl":"https://arrow.local/dash",
             "sevDeskUrl":"https://my.sevdesk.de","calendarSource":"ics",
             "calendarSourceUrl":"/missioncontrol/calendars/work.ics","veloSourceUrl":"","dashSourceUrl":"",
             "veloApiUrl":"https://arrow.local/velo","dashApiUrl":"https://arrow.local/dash",
             "dailyTargetHours":7.5,"autoRefreshMinutes":15,
             "localTool1Label":"Grafana","localTool1Url":"http://pi.local:3000",
             "localTool2Label":"Local Tool 2","localTool2Url":""}
            """;

    @Test
    void putThenGetReturnsTheSavedSettings() throws Exception {
        mvc.perform(put("/api/v1/settings").header("Host", "mc.test")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calendarSource").value("ics"));

        mvc.perform(get("/api/v1/settings").header("Host", "mc.test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyTargetHours").value(7.5))
                .andExpect(jsonPath("$.autoRefreshMinutes").value(15))
                .andExpect(jsonPath("$.localTool1Label").value("Grafana"))
                .andExpect(jsonPath("$.dashApiUrl").value("https://arrow.local/dash"));
    }

    @Test
    void missingSeededKeyIsAServerErrorWithoutLeakingTheKey(@Autowired AppSettingsRepository repository)
            throws Exception {
        repository.deleteById("velo_url");

        mvc.perform(get("/api/v1/settings").header("Host", "mc.test"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.detail").value("Internal error"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("velo_url"))));
        // reset() restores the key via service.update()
    }

    @Test
    void missingFieldsAreRejectedWith422() throws Exception {
        mvc.perform(put("/api/v1/settings").header("Host", "mc.test")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"veloUrl\":\"http://x\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    void invalidValuesAreRejectedWith422AndKeepTheOldSettings() throws Exception {
        mvc.perform(put("/api/v1/settings").header("Host", "mc.test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY.replace("https://arrow.local/velo\",\"dashUrl", "javascript:alert(1)\",\"dashUrl")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("veloUrl")));

        mvc.perform(get("/api/v1/settings").header("Host", "mc.test"))
                .andExpect(jsonPath("$.veloUrl").value("http://localhost:4201"));
    }

    @Test
    void unreadableJsonIsAClientError() throws Exception {
        mvc.perform(put("/api/v1/settings").header("Host", "mc.test")
                        .contentType(MediaType.APPLICATION_JSON).content("{nope"))
                .andExpect(status().isBadRequest());
    }
}
