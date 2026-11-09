package com.ch3xy.missioncontrol.task;

import com.ch3xy.missioncontrol.common.error.ConflictException;
import com.ch3xy.missioncontrol.common.error.ValidationException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository repository;
    private final Clock clock;

    public TaskService(TaskRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    /** Tasks of one day, or of the brain dump when {@code planDate} is {@code null}. */
    public List<TaskResponse> list(LocalDate planDate) {
        return tasksOf(planDate).stream().map(TaskResponse::of).toList();
    }

    /** Unfinished tasks of days before {@code date}, offered for carry-over. */
    public List<TaskResponse> carryOver(LocalDate date) {
        return repository.findUnfinishedBefore(date).stream().map(TaskResponse::of).toList();
    }

    @Transactional
    public TaskResponse create(CreateTaskRequest req) {
        Task task = new Task(req.title().trim(), req.estimateMinutes(), req.planDate(),
                nextPosition(req.planDate()), clock.instant());
        requireTitle(task.getTitle());
        return TaskResponse.of(repository.save(task));
    }

    @Transactional
    public TaskResponse update(UUID id, UpdateTaskRequest req) {
        Task task = find(id);
        // Value comparison: both are Integer objects, `!=` would compare references above 127
        if (!Objects.equals(task.getVersion(), req.version())) {
            throw new ConflictException("version: the task was changed in the meantime, reload and try again");
        }
        String title = req.title().trim();
        requireTitle(title);
        task.update(title, req.estimateMinutes(), req.status(), clock.instant());
        // Flush first: the version in the answer must be the new one
        repository.flush();
        return TaskResponse.of(task);
    }

    @Transactional
    public void delete(UUID id, int version) {
        Task task = find(id);
        if (!Objects.equals(task.getVersion(), version)) {
            throw new ConflictException("version: the task was changed in the meantime, reload and try again");
        }
        repository.delete(task);
    }

    /** Appends the tasks, in the given order, to the end of the target day or the brain dump. */
    @Transactional
    public List<TaskResponse> move(MoveTasksRequest req) {
        LocalDate target = target(req.planDate(), req.backlog());
        Set<UUID> ids = new LinkedHashSet<>(req.ids());
        if (ids.size() != req.ids().size()) {
            throw new ValidationException("ids: must not contain duplicates");
        }
        List<Task> tasks = ids.stream().map(this::find).toList();
        int position = nextPosition(target);
        var now = clock.instant();
        for (Task task : tasks) {
            if (Objects.equals(task.getPlanDate(), target)) {
                continue;
            }
            task.moveTo(target, position++, now);
        }
        repository.flush();
        return tasks.stream().map(TaskResponse::of).toList();
    }

    @Transactional
    public List<TaskResponse> reorder(ReorderTasksRequest req) {
        LocalDate target = target(req.planDate(), req.backlog());
        if (new HashSet<>(req.ids()).size() != req.ids().size()) {
            throw new ValidationException("ids: must not contain duplicates");
        }
        List<Task> tasks = tasksOf(target);
        Set<UUID> current = tasks.stream().map(Task::getId).collect(Collectors.toSet());
        if (req.ids().size() != current.size() || !current.equals(new HashSet<>(req.ids()))) {
            throw new ConflictException("ids: the tasks of this day have changed, reload and try again");
        }
        var byId = tasks.stream().collect(Collectors.toMap(Task::getId, t -> t));
        var now = clock.instant();
        for (int i = 0; i < req.ids().size(); i++) {
            Task task = byId.get(req.ids().get(i));
            if (task.getPosition() != i) {
                int updated = target == null
                        ? repository.updateBacklogPosition(task.getId(), i, now)
                        : repository.updatePosition(task.getId(), target, i, now);
                // The task left this day in the meantime (e.g. moved by another request)
                if (updated != 1) {
                    throw new ConflictException("ids: the tasks of this day have changed, reload and try again");
                }
            }
        }
        return list(target);
    }

    /** {@code null} = brain dump; a day needs a date and the brain dump must not get one. */
    private static LocalDate target(LocalDate planDate, boolean backlog) {
        if (backlog && planDate != null) {
            throw new ValidationException("planDate: must be empty for the brain dump");
        }
        if (!backlog && planDate == null) {
            throw new ValidationException("planDate: required unless backlog is true");
        }
        return planDate;
    }

    private List<Task> tasksOf(LocalDate planDate) {
        return planDate == null
                ? repository.findByPlanDateIsNullOrderByPositionAscCreatedAtAsc()
                : repository.findByPlanDateOrderByPositionAscCreatedAtAsc(planDate);
    }

    /**
     * Not locked: two parallel creates for the same day may get the same position. The order then falls
     * back to the creation time and the next reorder renumbers the day, which is fine for one person.
     */
    private int nextPosition(LocalDate planDate) {
        return (planDate == null ? repository.maxBacklogPosition() : repository.maxPosition(planDate)) + 1;
    }

    private Task find(UUID id) {
        return repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Task not found"));
    }

    private static void requireTitle(String title) {
        if (title.isEmpty()) {
            throw new ValidationException("title: must not be blank");
        }
    }
}
