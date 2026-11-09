package com.ch3xy.missioncontrol.task;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * New order of all tasks of one day ({@code backlog: false} with {@code planDate}) or of the brain dump
 * ({@code backlog: true}). The list must
 * contain exactly the tasks there, so a stale client cannot silently drop one (409 otherwise).
 */
public record ReorderTasksRequest(
        LocalDate planDate,
        @NotNull @Size(max = 5000) List<@NotNull UUID> ids,
        @NotNull Boolean backlog
) {}
