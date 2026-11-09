package com.ch3xy.missioncontrol.common.error;

/** A request value is invalid; the message is written for the client and is returned with status 422. */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }
}
