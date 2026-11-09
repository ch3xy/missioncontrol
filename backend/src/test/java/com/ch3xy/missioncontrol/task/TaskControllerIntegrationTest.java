package com.ch3xy.missioncontrol.task;

import com.ch3xy.missioncontrol.AbstractIntegrationTest;
import com.ch3xy.missioncontrol.app.AccessGuardFilter;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TaskControllerIntegrationTest extends AbstractIntegrationTest {

    private static final String HOST = "mc.test";

    @Autowired WebApplicationContext context;
    @Autowired AccessGuardFilter guard;
    @Autowired TaskRepository repository;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(guard).build();
        repository.deleteAll();
    }

    private ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
                               String body) throws Exception {
        return mvc.perform(request.header("Host", HOST).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private String create(String title, Integer estimate, String date) throws Exception {
        String body = "{\"title\":\"" + title + "\",\"estimateMinutes\":" + estimate
                + ",\"planDate\":" + (date == null ? "null" : "\"" + date + "\"") + "}";
        String json = send(post("/api/v1/tasks"), body)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.id");
    }

    @Test
    void createdTasksAreListedPerDayInOrder() throws Exception {
        create("Steuerberater anrufen", 15, "2026-11-09");
        create("Angebot schreiben", null, "2026-11-09");
        create("Später", null, null);

        mvc.perform(get("/api/v1/tasks").param("date", "2026-11-09").header("Host", HOST))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].title").value("Steuerberater anrufen"))
                .andExpect(jsonPath("$[0].estimateMinutes").value(15))
                .andExpect(jsonPath("$[0].status").value("OPEN"))
                .andExpect(jsonPath("$[1].estimateMinutes").value(nullValue()))
                .andExpect(jsonPath("$[1].position").value(1));

        mvc.perform(get("/api/v1/tasks").header("Host", HOST))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].planDate").value(nullValue()));
    }

    @Test
    void updateSetsStatusAndDoneTime() throws Exception {
        String id = create("Rechnung", 30, "2026-11-09");

        send(put("/api/v1/tasks/" + id), "{\"title\":\"Rechnung senden\",\"estimateMinutes\":null,\"status\":\"DONE\",\"version\":0}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Rechnung senden"))
                .andExpect(jsonPath("$.estimateMinutes").value(nullValue()))
                .andExpect(jsonPath("$.doneAt").value(notNullValue()));

        send(put("/api/v1/tasks/" + id), "{\"title\":\"Rechnung senden\",\"status\":\"IN_PROGRESS\",\"version\":1}")
                .andExpect(jsonPath("$.doneAt").value(nullValue()));
    }

    @Test
    void invalidInputIsRejectedWith422() throws Exception {
        send(post("/api/v1/tasks"), "{\"title\":\"  \"}").andExpect(status().isUnprocessableContent());
        send(post("/api/v1/tasks"), "{\"title\":\"x\",\"estimateMinutes\":0}").andExpect(status().isUnprocessableContent());
        send(post("/api/v1/tasks"), "{\"title\":\"" + "x".repeat(201) + "\"}").andExpect(status().isUnprocessableContent());
    }

    @Test
    void unknownTaskIs404AndUnknownStatusIs400() throws Exception {
        send(put("/api/v1/tasks/00000000-0000-0000-0000-000000000000"), "{\"title\":\"x\",\"status\":\"OPEN\",\"version\":0}")
                .andExpect(status().isNotFound());
        String id = create("x", null, null);
        send(put("/api/v1/tasks/" + id), "{\"title\":\"x\",\"status\":\"LATER\",\"version\":0}").andExpect(status().isBadRequest());
    }

    @Test
    void carryOverListsUnfinishedTasksOfEarlierDaysAndMoveTakesThemOver() throws Exception {
        String open = create("Offen", 30, "2026-11-07");
        String done = create("Erledigt", 30, "2026-11-08");
        send(put("/api/v1/tasks/" + done), "{\"title\":\"Erledigt\",\"status\":\"DONE\",\"version\":0}");
        create("Heute", null, "2026-11-09");

        mvc.perform(get("/api/v1/tasks/carry-over").param("date", "2026-11-09").header("Host", HOST))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(open));

        send(post("/api/v1/tasks/move"), "{\"ids\":[\"" + open + "\"],\"planDate\":\"2026-11-09\",\"backlog\":false}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].planDate").value("2026-11-09"))
                .andExpect(jsonPath("$[0].position").value(1));

        mvc.perform(get("/api/v1/tasks/carry-over").param("date", "2026-11-09").header("Host", HOST))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void moveToTheBrainDumpAndRejectDuplicates() throws Exception {
        String id = create("Irgendwann", null, "2026-11-09");

        send(post("/api/v1/tasks/move"), "{\"ids\":[\"" + id + "\"],\"planDate\":null,\"backlog\":true}")
                .andExpect(jsonPath("$[0].planDate").value(nullValue()));
        send(post("/api/v1/tasks/move"), "{\"ids\":[\"" + id + "\",\"" + id + "\"],\"planDate\":null,\"backlog\":true}")
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    void reorderNeedsExactlyTheTasksOfTheDay() throws Exception {
        String a = create("A", null, "2026-11-09");
        String b = create("B", null, "2026-11-09");

        send(put("/api/v1/tasks/order"), "{\"planDate\":\"2026-11-09\",\"backlog\":false,\"ids\":[\"" + b + "\",\"" + a + "\"]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("B"))
                .andExpect(jsonPath("$[1].title").value("A"))
                // The order is not content: an edit based on version 0 still works afterwards
                .andExpect(jsonPath("$[1].version").value(0));
        send(put("/api/v1/tasks/" + a), "{\"title\":\"A2\",\"status\":\"OPEN\",\"version\":0}")
                .andExpect(status().isOk());

        send(put("/api/v1/tasks/order"), "{\"planDate\":\"2026-11-09\",\"backlog\":false,\"ids\":[\"" + a + "\"]}")
                .andExpect(status().isConflict());
        send(put("/api/v1/tasks/order"), "{\"planDate\":\"2026-11-09\",\"backlog\":false,\"ids\":[\"" + a + "\",\"" + a + "\"]}")
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    void deleteRemovesTheTask() throws Exception {
        String id = create("Weg", null, null);

        mvc.perform(delete("/api/v1/tasks/" + id).param("version", "1").header("Host", HOST))
                .andExpect(status().isConflict());
        mvc.perform(delete("/api/v1/tasks/" + id).param("version", "0").header("Host", HOST))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/v1/tasks/" + id).param("version", "0").header("Host", HOST))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateBasedOnAnOldVersionIsAConflict() throws Exception {
        String id = create("Zwei Geräte", null, "2026-11-09");
        send(put("/api/v1/tasks/" + id), "{\"title\":\"Gerät A\",\"status\":\"OPEN\",\"version\":0}")
                .andExpect(jsonPath("$.version").value(1));

        send(put("/api/v1/tasks/" + id), "{\"title\":\"Gerät B\",\"status\":\"DONE\",\"version\":0}")
                .andExpect(status().isConflict());
    }

    @Test
    void versionsAbove127AreComparedByValue() throws Exception {
        String id = create("Oft geändert", null, "2026-11-09");
        jdbc.update("update task set version = 200 where id = ?::uuid", id);

        send(put("/api/v1/tasks/" + id), "{\"title\":\"Noch einmal\",\"status\":\"OPEN\",\"version\":200}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(201));
    }

    @Test
    void moveNeedsAnExplicitTargetAndSkipsTasksAlreadyThere() throws Exception {
        String here = create("Schon da", null, "2026-11-09");
        String other = create("Neu", null, "2026-11-08");

        send(post("/api/v1/tasks/move"), "{\"ids\":[\"" + here + "\"]}").andExpect(status().isUnprocessableContent());
        send(post("/api/v1/tasks/move"), "{\"ids\":[\"" + here + "\"],\"backlog\":false}")
                .andExpect(status().isUnprocessableContent());
        send(post("/api/v1/tasks/move"), "{\"ids\":[\"" + here + "\"],\"planDate\":\"2026-11-09\",\"backlog\":true}")
                .andExpect(status().isUnprocessableContent());

        send(post("/api/v1/tasks/move"),
                "{\"ids\":[\"" + here + "\",\"" + other + "\"],\"planDate\":\"2026-11-09\",\"backlog\":false}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].position").value(0))
                .andExpect(jsonPath("$[1].position").value(1));
    }

    @Test
    void carryOverIncludesTasksInProgress() throws Exception {
        String id = create("Angefangen", null, "2026-11-08");
        send(put("/api/v1/tasks/" + id), "{\"title\":\"Angefangen\",\"status\":\"IN_PROGRESS\",\"version\":0}");

        mvc.perform(get("/api/v1/tasks/carry-over").param("date", "2026-11-09").header("Host", HOST))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));
    }
}
