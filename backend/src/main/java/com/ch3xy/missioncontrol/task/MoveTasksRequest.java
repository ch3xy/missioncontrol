package com.ch3xy.missioncontrol.task;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Moves tasks to the end of a day ({@code backlog: false} with {@code planDate}) or to the brain dump
 * ({@code backlog: true}, no {@code planDate}). The explicit flag keeps a forgotten date from silently
 * moving tasks to the brain dump.
 */
public record MoveTasksRequest(
        @NotEmpty @Size(max = 500) List<@NotNull UUID> ids,
        LocalDate planDate,
        @NotNull Boolean backlog
) {}
