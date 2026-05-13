package uk.gov.hmcts.reform.dev.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import uk.gov.hmcts.reform.dev.models.TaskStatus;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private TaskStatus status;
}
