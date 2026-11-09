package com.ch3xy.missioncontrol.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByPlanDateOrderByPositionAscCreatedAtAsc(LocalDate planDate);

    List<Task> findByPlanDateIsNullOrderByPositionAscCreatedAtAsc();

    /** Unfinished tasks of earlier days, oldest day first. */
    @Query("select t from Task t where t.planDate < :before and t.status <> com.ch3xy.missioncontrol.task.TaskStatus.DONE"
            + " order by t.planDate, t.position, t.createdAt")
    List<Task> findUnfinishedBefore(@Param("before") LocalDate before);

    @Query("select coalesce(max(t.position), -1) from Task t where t.planDate = :planDate")
    int maxPosition(@Param("planDate") LocalDate planDate);

    @Query("select coalesce(max(t.position), -1) from Task t where t.planDate is null")
    int maxBacklogPosition();

    /**
     * The order is not content of a task, so it bypasses {@code @Version} (bulk update): reordering must
     * not make an edit that is open on the same device fail with a conflict.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Task t set t.position = :position, t.updatedAt = :now where t.id = :id and t.planDate = :planDate")
    int updatePosition(@Param("id") UUID id, @Param("planDate") LocalDate planDate, @Param("position") int position,
                       @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Task t set t.position = :position, t.updatedAt = :now where t.id = :id and t.planDate is null")
    int updateBacklogPosition(@Param("id") UUID id, @Param("position") int position, @Param("now") Instant now);
}
