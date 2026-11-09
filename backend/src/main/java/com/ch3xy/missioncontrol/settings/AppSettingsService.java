package com.ch3xy.missioncontrol.settings;

import com.ch3xy.missioncontrol.common.error.ValidationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class AppSettingsService {

    static final Set<String> CALENDAR_SOURCES = Set.of("none", "ics", "local-json");
    static final Set<Integer> AUTO_REFRESH_MINUTES = Set.of(0, 1, 5, 15, 30);

    private final AppSettingsRepository repository;

    public AppSettingsService(AppSettingsRepository repository) {
        this.repository = repository;
    }

    public AppSettingsResponse getAll() {
        return new AppSettingsResponse(
                require("velo_url"),
                require("dash_url"),
                require("sevdesk_url"),
                require("calendar_source"),
                require("calendar_source_url"),
                require("velo_source_url"),
                require("dash_source_url"),
                require("velo_api_url"),
                require("dash_api_url"),
                new BigDecimal(require("daily_target_hours")),
                Integer.parseInt(require("auto_refresh_minutes")),
                require("local_tool_1_label"),
                require("local_tool_1_url"),
                require("local_tool_2_label"),
                require("local_tool_2_url")
        );
    }

    /**
     * Validates in the service (not only via Bean Validation) so every caller, including later
     * import and restore paths, is held to the same rules. Stored values must always be parseable,
     * otherwise {@link #getAll()} fails for every request.
     */
    @Transactional
    public AppSettingsResponse update(AppSettingsRequest req) {
        validate(req);
        save("velo_url", req.veloUrl().trim());
        save("dash_url", req.dashUrl().trim());
        save("sevdesk_url", req.sevDeskUrl().trim());
        save("calendar_source", req.calendarSource());
        save("calendar_source_url", req.calendarSourceUrl());
        save("velo_source_url", req.veloSourceUrl());
        save("dash_source_url", req.dashSourceUrl());
        save("velo_api_url", req.veloApiUrl());
        save("dash_api_url", req.dashApiUrl());
        save("daily_target_hours", req.dailyTargetHours().stripTrailingZeros().toPlainString());
        save("auto_refresh_minutes", String.valueOf(req.autoRefreshMinutes()));
        save("local_tool_1_label", req.localTool1Label().trim());
        save("local_tool_1_url", req.localTool1Url().trim());
        save("local_tool_2_label", req.localTool2Label().trim());
        save("local_tool_2_url", req.localTool2Url().trim());
        return getAll();
    }

    /** Throws {@link ValidationException} naming the first invalid field. */
    public void validate(AppSettingsRequest req) {
        requireWebUrl("veloUrl", req.veloUrl());
        requireWebUrl("dashUrl", req.dashUrl());
        requireWebUrl("sevDeskUrl", req.sevDeskUrl());
        if (req.localTool1Url() != null && !req.localTool1Url().isBlank()) {
            requireWebUrl("localTool1Url", req.localTool1Url());
        }
        if (req.localTool2Url() != null && !req.localTool2Url().isBlank()) {
            requireWebUrl("localTool2Url", req.localTool2Url());
        }
        if (req.calendarSource() == null || !CALENDAR_SOURCES.contains(req.calendarSource())) {
            throw new ValidationException("calendarSource: unknown source '" + req.calendarSource() + "'");
        }
        requireSourceUrls("calendarSourceUrl", req.calendarSourceUrl());
        requireSourceUrls("veloSourceUrl", req.veloSourceUrl());
        requireSourceUrls("dashSourceUrl", req.dashSourceUrl());
        requireSourceUrls("veloApiUrl", req.veloApiUrl());
        requireSourceUrls("dashApiUrl", req.dashApiUrl());
        BigDecimal hours = req.dailyTargetHours();
        if (hours == null || hours.signum() <= 0 || hours.compareTo(BigDecimal.valueOf(24)) > 0) {
            throw new ValidationException("dailyTargetHours: must be greater than 0 and at most 24");
        }
        if (req.autoRefreshMinutes() == null || !AUTO_REFRESH_MINUTES.contains(req.autoRefreshMinutes())) {
            throw new ValidationException("autoRefreshMinutes: must be one of 0, 1, 5, 15, 30");
        }
    }

    /** Links and fetches use these values, so only http(s) is accepted; {@code javascript:} etc. never. */
    private static void requireWebUrl(String field, String value) {
        if (value == null || value.isBlank() || !isHttpUrl(value.trim())) {
            throw new ValidationException(field + ": must be an http or https URL without user name or password");
        }
    }

    /**
     * Source fields hold one URL per line, empty when unused. Same rule as the frontend
     * ({@code isSourceUrl} in source-urls.ts): a line is an absolute http(s) URL without credentials
     * or a path on the same host that starts with a single {@code /}. Everything else is refused,
     * including scheme-less hosts such as {@code arrow.local/x.ics} and protocol-relative {@code //host/x}.
     */
    private static void requireSourceUrls(String field, String value) {
        if (value == null) {
            throw new ValidationException(field + ": must not be null");
        }
        for (String line : value.split("\\R")) {
            String url = line.trim();
            if (url.isEmpty()) {
                continue;
            }
            boolean sameHostPath = url.startsWith("/") && !url.startsWith("//");
            if (!sameHostPath && !isHttpUrl(url)) {
                throw new ValidationException(field
                        + ": each line must be an http(s) URL without user name or password or a path starting with a single '/'");
            }
        }
    }

    /**
     * Absolute http(s) URL with a host and without user info: settings end up in backups and must
     * not carry credentials (same as {@code isHttpUrl} in the frontend).
     */
    static boolean isHttpUrl(String value) {
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            return (scheme.equals("http") || scheme.equals("https"))
                    && uri.getHost() != null
                    && uri.getRawUserInfo() == null;
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private void save(String key, String value) {
        AppSetting setting = repository.findById(key).orElseGet(() -> new AppSetting(key, value));
        setting.setValue(value);
        repository.save(setting);
    }

    private String require(String key) {
        return repository.findById(key)
                .map(AppSetting::getValue)
                .orElseThrow(() -> new MissingSettingException(key));
    }

    /**
     * A seeded key is gone: a server-side data problem, not a client conflict. Deliberately not an
     * {@link IllegalStateException}, so it ends in the generic 500 handler without echoing the key.
     */
    static final class MissingSettingException extends RuntimeException {
        MissingSettingException(String key) {
            super("Setting '" + key + "' not found");
        }
    }
}
