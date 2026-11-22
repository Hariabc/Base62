package com.base62.user;

public enum UserTier {
    FREE(100),
    PRO(1000),
    ENTERPRISE(5000);

    private final int requestsPerMinute;

    UserTier(int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    public int getRequestsPerMinute() {
        return requestsPerMinute;
    }
}
