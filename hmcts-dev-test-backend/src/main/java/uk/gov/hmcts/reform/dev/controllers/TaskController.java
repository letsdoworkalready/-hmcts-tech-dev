package uk.gov.hmcts.reform.dev.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import uk.gov.hmcts.reform.dev.dto.CreateTaskRequest;
import uk.gov.hmcts.reform.dev.dto.TaskResponse;
import uk.gov.hmcts.reform.dev.dto.UpdateStatusRequest;
import uk.gov.hmcts.reform.dev.dto.UpdateTaskRequest;
import uk.gov.hmcts.reform.dev.services.TaskService;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@Validated
@Tag(name = "Tasks", description = "Task management API")
public class TaskController {

    static final String ACTOR_HEADER = "X-Actor-Name";

    private final TaskService taskService;

    @Operation(summary = "Create a new task")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Task created",
            content = @Content(schema = @Schema(implementation = TaskResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<TaskResponse> createTask(
        @Valid @RequestBody CreateTaskRequest request,
        @Parameter(description = "Name of the caseworker performing this action", required = true)
        @NotBlank(message = "X-Actor-Name header is required")
        @RequestHeader(ACTOR_HEADER) String actor
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskService.createTask(request, actor));
    }

    @Operation(summary = "Retrieve all tasks")
    @ApiResponse(responseCode = "200", description = "List of tasks")
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @Operation(summary = "Retrieve a task by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Task found",
            content = @Content(schema = @Schema(implementation = TaskResponse.class))),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @Operation(summary = "Update a task")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Task updated"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
        @PathVariable Long id,
        @Valid @RequestBody UpdateTaskRequest request,
        @NotBlank(message = "X-Actor-Name header is required")
        @RequestHeader(ACTOR_HEADER) String actor
    ) {
        return ResponseEntity.ok(taskService.updateTask(id, request, actor));
    }

    @Operation(summary = "Update the status of a task")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Status updated"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
        @PathVariable Long id,
        @Valid @RequestBody UpdateStatusRequest request,
        @NotBlank(message = "X-Actor-Name header is required")
        @RequestHeader(ACTOR_HEADER) String actor
    ) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request, actor));
    }

    @Operation(summary = "Delete a task")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Task deleted"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteTask(
        @PathVariable Long id,
        @NotBlank(message = "X-Actor-Name header is required")
        @RequestHeader(ACTOR_HEADER) String actor
    ) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
