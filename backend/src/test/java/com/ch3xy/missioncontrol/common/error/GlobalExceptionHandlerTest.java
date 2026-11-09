package com.ch3xy.missioncontrol.common.error;

import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void validationExceptionIs422WithItsMessage() {
        ProblemDetail pd = handler.handleValidation(new ValidationException("field: bad"));

        assertThat(pd.getStatus()).isEqualTo(422);
        assertThat(pd.getDetail()).isEqualTo("field: bad");
    }

    @Test
    void conflictExceptionIs409WithItsMessage() {
        ProblemDetail pd = handler.handleConflict(new ConflictException("already there"));

        assertThat(pd.getStatus()).isEqualTo(409);
        assertThat(pd.getDetail()).isEqualTo("already there");
    }

    @Test
    void plainJdkExceptionsAreGeneric500WithoutInternalText() {
        for (Exception ex : new Exception[] {new IllegalArgumentException("secret a"), new IllegalStateException("secret b")}) {
            ProblemDetail pd = handler.handleGeneric(ex);

            assertThat(pd.getStatus()).isEqualTo(500);
            assertThat(pd.getDetail()).isEqualTo("Internal error");
        }
    }
}
