package com.ch3xy.missioncontrol.common.error;

/** The request conflicts with the current state; the message is written for the client and is returned with status 409. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
