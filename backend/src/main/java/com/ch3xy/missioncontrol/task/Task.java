package com.ch3xy.missioncontrol.task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.DynamicUpdate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** {@code @DynamicUpdate}: an update writes only changed columns, so it never puts back an old position. */
@Entity
@DynamicUpdate
@Table(name = "task")
public class Task {

    @Id
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    /** Optional; tasks without an estimate do not count towards the capacity. */
    @Column(name = "estimate_minutes")
    private Integer estimateMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status;

    /** Local day the task is planned for; {@code null} = brain dump. */
    @Column(name = "plan_date")
    private LocalDate planDate;

    @Column(nullable = false)
    private int position;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "done_at")
    private Instant doneAt;

    /** Increases with every change; updates must be based on the current version. */
    @Version
    @Column(nullable = false)
    private Integer version;

    protected Task() {}

    public Task(String title, Integer estimateMinutes, LocalDate planDate, int position, Instant now) {
        this.id = UUID.randomUUID();
        this.title = title;
        this.estimateMinutes = estimateMinutes;
        this.status = TaskStatus.OPEN;
        this.planDate = planDate;
        this.position = position;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public Integer getEstimateMinutes() { return estimateMinutes; }
    public TaskStatus getStatus() { return status; }
    public LocalDate getPlanDate() { return planDate; }
    public int getPosition() { return position; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getDoneAt() { return doneAt; }
    /** {@code null} until persisted, which also tells Spring Data that the entity is new. */
    public Integer getVersion() { return version; }

    void update(String title, Integer estimateMinutes, TaskStatus status, Instant now) {
        this.title = title;
        this.estimateMinutes = estimateMinutes;
        if (status != this.status) {
            this.doneAt = status == TaskStatus.DONE ? now : null;
        }
        this.status = status;
        this.updatedAt = now;
    }

    void moveTo(LocalDate planDate, int position, Instant now) {
        this.planDate = planDate;
        this.position = position;
        this.updatedAt = now;
    }

}
