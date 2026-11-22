package com.base62.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.base62.common.ApiResponse;
import com.base62.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(10) // After JwtAuthenticationFilter
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RateLimitFilter(RateLimiterService rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Skip internal/docs/static paths
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") ||
                path.startsWith("/actuator") || path.startsWith("/h2-console")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Determine client identity & rate limit bucket
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String clientKey;
        int limit;
        String endpointCategory;

        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            clientKey = "user:" + principal.getId();
            limit = rateLimiterService.getTierLimit(principal.getTier());
            endpointCategory = "api_user";
        } else {
            clientKey = "ip:" + getClientIp(request);
            if (path.startsWith("/api/v1/auth/login") || path.startsWith("/api/v1/auth/register")) {
                limit = 10; // 10 auth attempts/min
                endpointCategory = "auth";
            } else if (path.startsWith("/r/")) {
                limit = 120; // 120 redirects/min for anonymous IP
                endpointCategory = "redirect";
            } else {
                limit = 20; // 20 requests/min for anonymous general API
                endpointCategory = "anon";
            }
        }

        RateLimiterService.RateLimitResult rateResult = rateLimiterService.checkLimit(clientKey, endpointCategory, limit);

        // Add standard rate limit headers
        response.setHeader("X-RateLimit-Limit", String.valueOf(rateResult.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(rateResult.remaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(rateResult.resetSeconds()));

        if (!rateResult.allowed()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(rateResult.resetSeconds()));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            ApiResponse<Void> errorResponse = ApiResponse.error(
                    "Rate limit of " + rateResult.limit() + " req/min exceeded. Retry in " + rateResult.resetSeconds() + " seconds."
            );
            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return (ip != null) ? ip : "127.0.0.1";
    }
}
