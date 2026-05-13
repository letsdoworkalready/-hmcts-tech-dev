package uk.gov.hmcts.reform.dev.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.gov.hmcts.reform.dev.dto.CreateTaskRequest;
import uk.gov.hmcts.reform.dev.dto.TaskResponse;
import uk.gov.hmcts.reform.dev.dto.UpdateStatusRequest;
import uk.gov.hmcts.reform.dev.dto.UpdateTaskRequest;
import uk.gov.hmcts.reform.dev.exception.TaskNotFoundException;
import uk.gov.hmcts.reform.dev.models.Task;
import uk.gov.hmcts.reform.dev.repositories.TaskRepository;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request, String actor) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        Task task = Task.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .status(request.getStatus())
            .dueDateTime(request.getDueDateTime())
            .createdAt(now)
            .updatedAt(now)
            .createdBy(actor)
            .updatedBy(actor)
            .build();
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
            .map(TaskResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        return taskRepository.findById(id)
            .map(TaskResponse::from)
            .orElseThrow(() -> new TaskNotFoundException(id));
    }

    @Transactional
    public TaskResponse updateTask(Long id, UpdateTaskRequest request, String actor) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new TaskNotFoundException(id));

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setDueDateTime(request.getDueDateTime());
        task.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        task.setUpdatedBy(actor);

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, UpdateStatusRequest request, String actor) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new TaskNotFoundException(id));

        task.setStatus(request.getStatus());
        task.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        task.setUpdatedBy(actor);

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new TaskNotFoundException(id);
        }
        taskRepository.deleteById(id);
    }
}
