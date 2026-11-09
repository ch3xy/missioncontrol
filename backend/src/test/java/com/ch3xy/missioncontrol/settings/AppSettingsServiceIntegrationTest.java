package com.ch3xy.missioncontrol.settings;

import com.ch3xy.missioncontrol.AbstractIntegrationTest;
import com.ch3xy.missioncontrol.common.error.ValidationException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AppSettingsServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired AppSettingsService service;
    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;

    @AfterEach
    void reset() {
        service.update(valid());
    }

    static AppSettingsRequest valid() {
        return new AppSettingsRequest(
                "http://localhost:4201", "http://localhost:4202", "https://my.sevdesk.de",
                "none", "", "", "", "", "",
                new BigDecimal("8"), 5,
                "Local Tool 1", "", "Local Tool 2", "");
    }

    static AppSettingsRequest with(java.util.function.UnaryOperator<Builder> change) {
        return change.apply(new Builder(valid())).build();
    }

    /** Small copy helper, records have no withers. */
    record Builder(AppSettingsRequest r) {
        AppSettingsRequest build() { return r; }
        Builder veloUrl(String v) {
            return new Builder(new AppSettingsRequest(v, r.dashUrl(), r.sevDeskUrl(), r.calendarSource(),
                    r.calendarSourceUrl(), r.veloSourceUrl(), r.dashSourceUrl(), r.veloApiUrl(), r.dashApiUrl(),
                    r.dailyTargetHours(), r.autoRefreshMinutes(), r.localTool1Label(), r.localTool1Url(),
                    r.localTool2Label(), r.localTool2Url()));
        }
        Builder calendar(String source, String urls) {
            return new Builder(new AppSettingsRequest(r.veloUrl(), r.dashUrl(), r.sevDeskUrl(), source, urls,
                    r.veloSourceUrl(), r.dashSourceUrl(), r.veloApiUrl(), r.dashApiUrl(),
                    r.dailyTargetHours(), r.autoRefreshMinutes(), r.localTool1Label(), r.localTool1Url(),
                    r.localTool2Label(), r.localTool2Url()));
        }
        Builder target(String hours, int refresh) {
            return new Builder(new AppSettingsRequest(r.veloUrl(), r.dashUrl(), r.sevDeskUrl(), r.calendarSource(),
                    r.calendarSourceUrl(), r.veloSourceUrl(), r.dashSourceUrl(), r.veloApiUrl(), r.dashApiUrl(),
                    new BigDecimal(hours), refresh, r.localTool1Label(), r.localTool1Url(),
                    r.localTool2Label(), r.localTool2Url()));
        }
        Builder tool1Url(String url) {
            return new Builder(new AppSettingsRequest(r.veloUrl(), r.dashUrl(), r.sevDeskUrl(), r.calendarSource(),
                    r.calendarSourceUrl(), r.veloSourceUrl(), r.dashSourceUrl(), r.veloApiUrl(), r.dashApiUrl(),
                    r.dailyTargetHours(), r.autoRefreshMinutes(), r.localTool1Label(), url,
                    r.localTool2Label(), r.localTool2Url()));
        }
    }

    /**
     * Runs the migrations into a fresh schema so the result does not depend on test order or on
     * what other tests stored. Expected values are DEFAULT_SETTINGS of the frontend.
     */
    @Test
    void migrationDefaultsMatchTheFrontendDefaults() {
        jdbc.execute("drop schema if exists mig_check cascade");
        try {
            Flyway.configure().dataSource(dataSource).schemas("mig_check").createSchemas(true)
                    .locations("classpath:db/migration").load().migrate();

            Map<String, String> stored = new LinkedHashMap<>();
            jdbc.query("select key, value from mig_check.app_settings",
                    rs -> { stored.put(rs.getString("key"), rs.getString("value")); });

            assertThat(stored).containsExactlyInAnyOrderEntriesOf(Map.ofEntries(
                    Map.entry("velo_url", "http://localhost:4201"),
                    Map.entry("dash_url", "http://localhost:4202"),
                    Map.entry("sevdesk_url", "https://my.sevdesk.de"),
                    Map.entry("calendar_source", "none"),
                    Map.entry("calendar_source_url", ""),
                    Map.entry("velo_source_url", ""),
                    Map.entry("dash_source_url", ""),
                    Map.entry("velo_api_url", ""),
                    Map.entry("dash_api_url", ""),
                    Map.entry("daily_target_hours", "8"),
                    Map.entry("auto_refresh_minutes", "5"),
                    Map.entry("local_tool_1_label", "Local Tool 1"),
                    Map.entry("local_tool_1_url", ""),
                    Map.entry("local_tool_2_label", "Local Tool 2"),
                    Map.entry("local_tool_2_url", "")));
        } finally {
            jdbc.execute("drop schema if exists mig_check cascade");
        }
    }

    @Test
    void validSettingsAreStoredAndTrimmed() {
        service.update(with(b -> b.veloUrl("  https://arrow.local/velo/ ")
                .calendar("ics", "/missioncontrol/calendars/work.ics\nhttps://example.org/a.ics")
                .target("7.5", 15)));

        AppSettingsResponse all = service.getAll();
        assertThat(all.veloUrl()).isEqualTo("https://arrow.local/velo/");
        assertThat(all.calendarSource()).isEqualTo("ics");
        assertThat(all.calendarSourceUrl()).contains("\n").contains("work.ics");
        assertThat(all.dailyTargetHours()).isEqualByComparingTo("7.5");
        assertThat(all.autoRefreshMinutes()).isEqualTo(15);
    }

    @Test
    void scriptSchemesAreRejectedAndNothingIsStored() {
        assertThatThrownBy(() -> service.update(with(b -> b.veloUrl("javascript:alert(1)"))))
                .isInstanceOf(ValidationException.class).hasMessageContaining("veloUrl");
        assertThatThrownBy(() -> service.update(with(b -> b.tool1Url("data:text/html,x"))))
                .isInstanceOf(ValidationException.class).hasMessageContaining("localTool1Url");
        assertThatThrownBy(() -> service.update(with(b -> b.calendar("ics", "/ok.ics\nfile:///etc/passwd"))))
                .isInstanceOf(ValidationException.class).hasMessageContaining("calendarSourceUrl");

        assertThat(service.getAll().veloUrl()).isEqualTo("http://localhost:4201");
    }

    @Test
    void requiredUrlsMustBeParsableHttpUrlsWithoutCredentials() {
        for (String bad : new String[] {"arrow.local/velo", "//evil.example/x", "http://", "https://user:pw@host/x",
                "https://user@host/x", "ftp://host/x", "http://exa mple.org", "mailto:a@b.c", "/velo", ""}) {
            assertThatThrownBy(() -> service.update(with(b -> b.veloUrl(bad))))
                    .as(bad).isInstanceOf(ValidationException.class).hasMessageContaining("veloUrl");
        }
        assertThatThrownBy(() -> service.update(with(b -> b.tool1Url("https://user:pw@host/x"))))
                .isInstanceOf(ValidationException.class).hasMessageContaining("localTool1Url");
        service.update(with(b -> b.veloUrl("HTTPS://Arrow.local:8443/velo")));
        assertThat(service.getAll().veloUrl()).isEqualTo("HTTPS://Arrow.local:8443/velo");
    }

    @Test
    void sourceUrlsAreAbsoluteHttpUrlsOrSingleSlashPaths() {
        for (String bad : new String[] {"arrow.local/x.ics", "//evil.example/x.ics", "javascript:alert(1)",
                "https://user:pw@host/x.ics", "relative/x.ics", "host:8080/x", "/ok.ics\n//evil.example/x.ics"}) {
            assertThatThrownBy(() -> service.update(with(b -> b.calendar("ics", bad))))
                    .as(bad).isInstanceOf(ValidationException.class).hasMessageContaining("calendarSourceUrl");
        }
        service.update(with(b -> b.calendar("ics", "/a.ics\n\n  https://example.org/b.ics \r\nhttp://localhost:8080/c.ics")));
        assertThat(service.getAll().calendarSourceUrl()).contains("/a.ics").contains("b.ics");
    }

    @Test
    void sameRulesApplyToTheOtherSourceFields() {
        var request = valid();
        var bad = new AppSettingsRequest(request.veloUrl(), request.dashUrl(), request.sevDeskUrl(),
                request.calendarSource(), request.calendarSourceUrl(), "arrow.local/v", request.dashSourceUrl(),
                request.veloApiUrl(), request.dashApiUrl(), request.dailyTargetHours(), request.autoRefreshMinutes(),
                request.localTool1Label(), request.localTool1Url(), request.localTool2Label(), request.localTool2Url());
        assertThatThrownBy(() -> service.update(bad))
                .isInstanceOf(ValidationException.class).hasMessageContaining("veloSourceUrl");
    }

    @Test
    void unknownCalendarSourceIsRejected() {
        assertThatThrownBy(() -> service.update(with(b -> b.calendar("mock", ""))))
                .isInstanceOf(ValidationException.class).hasMessageContaining("calendarSource");
    }

    @Test
    void targetHoursAndRefreshIntervalAreChecked() {
        assertThatThrownBy(() -> service.update(with(b -> b.target("0", 5))))
                .isInstanceOf(ValidationException.class).hasMessageContaining("dailyTargetHours");
        assertThatThrownBy(() -> service.update(with(b -> b.target("24.5", 5))))
                .isInstanceOf(ValidationException.class).hasMessageContaining("dailyTargetHours");
        assertThatThrownBy(() -> service.update(with(b -> b.target("8", 7))))
                .isInstanceOf(ValidationException.class).hasMessageContaining("autoRefreshMinutes");
        service.update(with(b -> b.target("24", 0)));
        assertThat(service.getAll().autoRefreshMinutes()).isZero();
    }
}
