package com.ch3xy.missioncontrol.settings;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Mirrors {@code MissionControlSettings} of the frontend. Optional fields may be empty but not
 * {@code null}, so PUT always replaces the complete settings. Semantic checks (URL scheme, allowed
 * values) live in {@link AppSettingsService}.
 */
public record AppSettingsRequest(
        @NotBlank @Size(max = 2000) String veloUrl,
        @NotBlank @Size(max = 2000) String dashUrl,
        @NotBlank @Size(max = 2000) String sevDeskUrl,
        @NotBlank String calendarSource,
        // Several URLs, one per line
        @NotNull @Size(max = 8000) String calendarSourceUrl,
        @NotNull @Size(max = 2000) String veloSourceUrl,
        @NotNull @Size(max = 2000) String dashSourceUrl,
        @NotNull @Size(max = 2000) String veloApiUrl,
        @NotNull @Size(max = 2000) String dashApiUrl,
        @NotNull @DecimalMin(value = "0", inclusive = false) @DecimalMax("24") @Digits(integer = 2, fraction = 2) BigDecimal dailyTargetHours,
        @NotNull Integer autoRefreshMinutes,
        @NotBlank @Size(max = 100) String localTool1Label,
        @NotNull @Size(max = 2000) String localTool1Url,
        @NotBlank @Size(max = 100) String localTool2Label,
        @NotNull @Size(max = 2000) String localTool2Url
) {}
