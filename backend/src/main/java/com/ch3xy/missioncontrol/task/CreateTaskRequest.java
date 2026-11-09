package com.ch3xy.missioncontrol.task;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** New tasks start as OPEN at the end of their day; without {@code planDate} they go to the brain dump. */
public record CreateTaskRequest(
        @NotBlank @Size(max = 200) String title,
        @Min(1) @Max(1440) Integer estimateMinutes,
        LocalDate planDate
) {}
