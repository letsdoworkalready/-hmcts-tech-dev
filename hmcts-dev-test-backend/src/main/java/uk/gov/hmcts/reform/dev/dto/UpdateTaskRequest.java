package uk.gov.hmcts.reform.dev.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import uk.gov.hmcts.reform.dev.models.TaskStatus;

import java.time.OffsetDateTime;

@Data
public class UpdateTaskRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotNull(message = "Status is required")
    private TaskStatus status;

    @NotNull(message = "Due date/time is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private OffsetDateTime dueDateTime;
}
