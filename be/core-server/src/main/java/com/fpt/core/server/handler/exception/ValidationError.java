package com.fpt.core.server.handler.exception;

public record ValidationError(String field, String message) {}
