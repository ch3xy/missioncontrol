package com.ch3xy.missioncontrol.task;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Tasks", description = "Tagesplan: Aufgaben eines Tages, Brain-Dump und Übernahme unerledigter Aufgaben.")
@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @Operation(summary = "Aufgaben eines Tages", description = "Ohne `date` die Aufgaben im Brain-Dump. Sortiert nach Reihenfolge.")
    @GetMapping
    public List<TaskResponse> list(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.list(date);
    }

    @Operation(summary = "Unerledigte Aufgaben vor einem Tag", description = "Vorschläge zur Übernahme auf `date`.")
    @GetMapping("/carry-over")
    public List<TaskResponse> carryOver(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.carryOver(date);
    }

    @Operation(summary = "Aufgabe anlegen", description = "Neu am Ende des Tages bzw. des Brain-Dumps, Status OPEN.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@Valid @RequestBody CreateTaskRequest req) {
        return service.create(req);
    }

    @Operation(summary = "Aufgabe ändern", description = "Ersetzt Titel, Schätzung (null entfernt sie) und Status.")
    @PutMapping("/{id}")
    public TaskResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateTaskRequest req) {
        return service.update(id, req);
    }

    @Operation(summary = "Aufgabe löschen", description = "`version` wie beim Ändern; 409, wenn sich die Aufgabe inzwischen geändert hat.")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @RequestParam int version) {
        service.delete(id, version);
    }

    @Operation(summary = "Aufgaben verschieben", description = "Ans Ende eines Tages (`backlog: false` mit `planDate`) oder in den Brain-Dump (`backlog: true`, ohne `planDate`).")
    @PostMapping("/move")
    public List<TaskResponse> move(@Valid @RequestBody MoveTasksRequest req) {
        return service.move(req);
    }

    @Operation(summary = "Reihenfolge setzen", description = "Alle Aufgaben eines Tages bzw. des Brain-Dumps (`backlog`-Flag wie bei move) in neuer Reihenfolge; 409, wenn die Liste nicht mehr stimmt. Ändert die Version nicht.")
    @PutMapping("/order")
    public List<TaskResponse> reorder(@Valid @RequestBody ReorderTasksRequest req) {
        return service.reorder(req);
    }
}
