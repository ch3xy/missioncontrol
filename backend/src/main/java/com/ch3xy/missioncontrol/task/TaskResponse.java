package com.ch3xy.missioncontrol.task;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String title,
        Integer estimateMinutes,
        TaskStatus status,
        LocalDate planDate,
        int position,
        Instant doneAt,
        int version
) {
    static TaskResponse of(Task task) {
        return new TaskResponse(task.getId(), task.getTitle(), task.getEstimateMinutes(), task.getStatus(),
                task.getPlanDate(), task.getPosition(), task.getDoneAt(), task.getVersion());
    }
}
