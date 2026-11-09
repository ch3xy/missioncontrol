package com.ch3xy.missioncontrol.task;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Replaces title, estimate ({@code null} removes it) and status. Day and order change via move/order.
 * {@code version} is the version the client saw; a newer one in the database means another device changed
 * the task in between (409).
 */
public record UpdateTaskRequest(
        @NotBlank @Size(max = 200) String title,
        @Min(1) @Max(1440) Integer estimateMinutes,
        @NotNull TaskStatus status,
        @NotNull Integer version
) {}
