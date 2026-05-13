package uk.gov.hmcts.reform.dev.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import uk.gov.hmcts.reform.dev.dto.CreateTaskRequest;
import uk.gov.hmcts.reform.dev.dto.TaskResponse;
import uk.gov.hmcts.reform.dev.exception.TaskNotFoundException;
import uk.gov.hmcts.reform.dev.models.TaskStatus;
import uk.gov.hmcts.reform.dev.services.TaskService;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

    private ObjectMapper objectMapper;
    private TaskResponse sampleResponse;
    private final OffsetDateTime now = OffsetDateTime.now();

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        sampleResponse = TaskResponse.builder()
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
    @DisplayName("POST /tasks - returns 201 with created task")
    void createTask_returns201() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Test task");
        request.setStatus(TaskStatus.TODO);
        request.setDueDateTime(now.plusDays(1));

        when(taskService.createTask(any(), eq("Alice"))).thenReturn(sampleResponse);

        mockMvc.perform(post("/tasks")
                .header("X-Actor-Name", "Alice")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("Test task"))
            .andExpect(jsonPath("$.createdBy").value("Alice"));
    }

    @Test
    @DisplayName("POST /tasks - returns 400 when title is missing")
    void createTask_returns400WhenTitleMissing() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setStatus(TaskStatus.TODO);
        request.setDueDateTime(now.plusDays(1));

        mockMvc.perform(post("/tasks")
                .header("X-Actor-Name", "Alice")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /tasks - returns list of tasks")
    void getAllTasks_returnsList() throws Exception {
        when(taskService.getAllTasks()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/tasks"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].title").value("Test task"));
    }

    @Test
    @DisplayName("GET /tasks/{id} - returns 404 for unknown task")
    void getTaskById_returns404() throws Exception {
        when(taskService.getTaskById(99L)).thenThrow(new TaskNotFoundException(99L));

        mockMvc.perform(get("/tasks/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Task not found with id: 99"));
    }

    @Test
    @DisplayName("DELETE /tasks/{id} - returns 204 on success")
    void deleteTask_returns204() throws Exception {
        mockMvc.perform(delete("/tasks/1")
                .header("X-Actor-Name", "Alice"))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /tasks/{id} - returns 404 for unknown task")
    void deleteTask_returns404() throws Exception {
        doThrow(new TaskNotFoundException(99L)).when(taskService).deleteTask(99L);

        mockMvc.perform(delete("/tasks/99")
                .header("X-Actor-Name", "Alice"))
            .andExpect(status().isNotFound());
    }
}
