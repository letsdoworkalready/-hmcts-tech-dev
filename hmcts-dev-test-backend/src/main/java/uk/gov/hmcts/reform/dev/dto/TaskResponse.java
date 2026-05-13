package uk.gov.hmcts.reform.dev.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import uk.gov.hmcts.reform.dev.models.Task;
import uk.gov.hmcts.reform.dev.models.TaskStatus;

import java.time.OffsetDateTime;

@Data
@Builder
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private TaskStatus status;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private OffsetDateTime dueDateTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private OffsetDateTime createdAt;

    private String createdBy;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private OffsetDateTime updatedAt;

    private String updatedBy;

    public static TaskResponse from(Task task) {
        return TaskResponse.builder()
            .id(task.getId())
            .title(task.getTitle())
            .description(task.getDescription())
            .status(task.getStatus())
            .dueDateTime(task.getDueDateTime())
            .createdAt(task.getCreatedAt())
            .createdBy(task.getCreatedBy())
            .updatedAt(task.getUpdatedAt())
            .updatedBy(task.getUpdatedBy())
            .build();
    }
}
