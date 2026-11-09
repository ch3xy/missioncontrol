package com.ch3xy.missioncontrol.settings;

import java.math.BigDecimal;

public record AppSettingsResponse(
        String veloUrl,
        String dashUrl,
        String sevDeskUrl,
        String calendarSource,
        String calendarSourceUrl,
        String veloSourceUrl,
        String dashSourceUrl,
        String veloApiUrl,
        String dashApiUrl,
        BigDecimal dailyTargetHours,
        int autoRefreshMinutes,
        String localTool1Label,
        String localTool1Url,
        String localTool2Label,
        String localTool2Url
) {}
