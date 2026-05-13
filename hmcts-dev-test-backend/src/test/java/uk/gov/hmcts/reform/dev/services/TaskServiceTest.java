package uk.gov.hmcts.reform.dev.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.gov.hmcts.reform.dev.dto.CreateTaskRequest;
import uk.gov.hmcts.reform.dev.dto.TaskResponse;
import uk.gov.hmcts.reform.dev.dto.UpdateStatusRequest;
import uk.gov.hmcts.reform.dev.dto.UpdateTaskRequest;
import uk.gov.hmcts.reform.dev.exception.TaskNotFoundException;
import uk.gov.hmcts.reform.dev.models.Task;
import uk.gov.hmcts.reform.dev.models.TaskStatus;
import uk.gov.hmcts.reform.dev.repositories.TaskRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    private Task sampleTask;
    private final OffsetDateTime now = OffsetDateTime.now();

    @BeforeEach
    void setUp() {
        sampleTask = Task.builder()
            .id(1L)
            .title("Test task")
            .description("A description")
            .status(TaskStatus.TODO)
            .dueDateTime(now.plusDays(1))
            .createdAt(now)
            .createdBy("Alice")
            .updatedAt(now)
            .updatedBy("Alice")
            .build();
    }

    @Test
    @DisplayName("createTask - saves and returns a TaskResponse with correct fields")
    void createTask_savesAndReturnsResponse() {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Test task");
        request.setDescription("A description");
        request.setStatus(TaskStatus.TODO);
        request.setDueDateTime(now.plusDays(1));

        when(taskRepository.save(any(Task.class))).thenReturn(sampleTask);

        TaskResponse response = taskService.createTask(request, "Alice");

        assertThat(response.getTitle()).isEqualTo("Test task");
        assertThat(response.getCreatedBy()).isEqualTo("Alice");
        assertThat(response.getStatus()).isEqualTo(TaskStatus.TODO);
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    @DisplayName("getAllTasks - returns mapped list of responses")
    void getAllTasks_returnsMappedList() {
        when(taskRepository.findAll()).thenReturn(List.of(sampleTask));

        List<TaskResponse> responses = taskService.getAllTasks();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getTaskById - returns response for existing task")
    void getTaskById_returnsResponse() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));

        TaskResponse response = taskService.getTaskById(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("Test task");
    }

    @Test
    @DisplayName("getTaskById - throws TaskNotFoundException for missing task")
    void getTaskById_throwsWhenNotFound() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTaskById(99L))
            .isInstanceOf(TaskNotFoundException.class)
            .hasMessageContaining("99");
    }

    @Test
    @DisplayName("updateTask - updates all fields and sets updatedBy")
    void updateTask_updatesFields() {
        UpdateTaskRequest request = new UpdateTaskRequest();
        request.setTitle("Updated title");
        request.setDescription("Updated description");
        request.setStatus(TaskStatus.IN_PROGRESS);
        request.setDueDateTime(now.plusDays(2));

        Task updatedTask = Task.builder()
            .id(1L)
            .title("Updated title")
            .description("Updated description")
            .status(TaskStatus.IN_PROGRESS)
            .dueDateTime(now.plusDays(2))
            .createdAt(now)
            .createdBy("Alice")
            .updatedAt(now)
            .updatedBy("Bob")
            .build();

        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenReturn(updatedTask);

        TaskResponse response = taskService.updateTask(1L, request, "Bob");

        assertThat(response.getTitle()).isEqualTo("Updated title");
        assertThat(response.getUpdatedBy()).isEqualTo("Bob");
        assertThat(response.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("updateTaskStatus - updates only status and sets updatedBy")
    void updateTaskStatus_updatesStatus() {
        UpdateStatusRequest request = new UpdateStatusRequest();
        request.setStatus(TaskStatus.DONE);

        Task doneTask = Task.builder()
            .id(1L).title("Test task").description("A description")
            .status(TaskStatus.DONE).dueDateTime(now.plusDays(1))
            .createdAt(now).createdBy("Alice").updatedAt(now).updatedBy("Bob")
            .build();

        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenReturn(doneTask);

        TaskResponse response = taskService.updateTaskStatus(1L, request, "Bob");

        assertThat(response.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(response.getUpdatedBy()).isEqualTo("Bob");
    }

    @Test
    @DisplayName("deleteTask - deletes existing task")
    void deleteTask_deletesSuccessfully() {
        when(taskRepository.existsById(1L)).thenReturn(true);

        taskService.deleteTask(1L);

        verify(taskRepository).deleteById(1L);
    }

    @Test
    @DisplayName("deleteTask - throws TaskNotFoundException for missing task")
    void deleteTask_throwsWhenNotFound() {
        when(taskRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> taskService.deleteTask(99L))
            .isInstanceOf(TaskNotFoundException.class)
            .hasMessageContaining("99");
    }
}
