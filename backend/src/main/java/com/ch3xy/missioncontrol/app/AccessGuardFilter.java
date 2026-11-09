package com.ch3xy.missioncontrol.app;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Applies {@link AccessPolicy} to every request and answers violations with 403. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AccessGuardFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AccessGuardFilter.class);

    private final AccessPolicy policy;

    public AccessGuardFilter(AccessPolicy policy) {
        this.policy = policy;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // getHeader, not getServerName: the forwarded-header filter may rewrite the latter
        String host = request.getHeader(HttpHeaders.HOST);
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        if (!policy.isHostAllowed(host)) {
            reject(response, "Host not allowed", host);
        } else if (!policy.isOriginAllowed(origin)) {
            reject(response, "Origin not allowed", origin);
        } else {
            chain.doFilter(request, response);
        }
    }

    private static void reject(HttpServletResponse response, String reason, String value) throws IOException {
        // The value comes from the client, so it is only logged (sanitised), never echoed back
        log.warn("{}: {}", reason, value == null ? "-" : value.replaceAll("[\\r\\n]", "_"));
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"title\":\"Forbidden\",\"status\":403,\"detail\":\"" + reason + "\"}");
    }
}
