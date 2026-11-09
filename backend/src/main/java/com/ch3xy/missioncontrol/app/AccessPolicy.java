package com.ch3xy.missioncontrol.app;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Auth stage 1: the network (home network, tailnet) is the login, but a browser on that network
 * can still be talked into calling the API (CSRF, DNS rebinding). Two checks close that gap:
 * <ul>
 *   <li><b>Host</b> must be a configured name or loopback. A rebinding page reaches the server
 *   under the attacker's host name, which is not on the list.</li>
 *   <li><b>Origin</b>, if the browser sends one, must be a configured origin. A foreign page
 *   always sends its own origin on cross-site requests.</li>
 * </ul>
 * IPv6 hosts are compared in the bracketed form of the {@code Host} header ({@code [fe80::1]:8082}), so
 * write them in square brackets in {@code MC_ALLOWED_HOSTS}; an unbracketed entry ({@code fe80::1}) is
 * bracketed when the configuration is read. A bare IPv6 address is never cut at a colon.
 * <p>
 * Requests without an Origin header (curl, health checks, same-origin GET) pass the second check.
 */
public final class AccessPolicy {

    private static final Set<String> LOOPBACK_HOSTS = Set.of("localhost", "127.0.0.1", "[::1]");

    private final Set<String> allowedHosts;
    private final Set<String> allowedOrigins;

    public AccessPolicy(List<String> allowedHosts, List<String> allowedOrigins) {
        this.allowedHosts = normalize(allowedHosts, false);
        this.allowedOrigins = normalize(allowedOrigins, true);
    }

    public boolean isHostAllowed(String hostHeader) {
        if (hostHeader == null || hostHeader.isBlank()) {
            return false;
        }
        String host = stripPort(hostHeader.trim().toLowerCase(Locale.ROOT));
        return LOOPBACK_HOSTS.contains(host) || allowedHosts.contains(host);
    }

    /** A missing Origin header is allowed; a present one must be configured. */
    public boolean isOriginAllowed(String originHeader) {
        if (originHeader == null) {
            return true;
        }
        return allowedOrigins.contains(trimSlash(originHeader.trim().toLowerCase(Locale.ROOT)));
    }

    static String stripPort(String host) {
        if (host.startsWith("[")) {
            int end = host.indexOf(']');
            return end < 0 ? host : host.substring(0, end + 1);
        }
        int colon = host.indexOf(':');
        if (colon != host.lastIndexOf(':')) {
            return host; // unbracketed IPv6: the colons are address separators, not a port
        }
        return colon < 0 ? host : host.substring(0, colon);
    }

    /** Hosts: port removed; an unbracketed IPv6 address from the configuration is put in brackets. */
    private static String normalizeHost(String host) {
        String stripped = stripPort(host);
        boolean bareIpv6 = !stripped.startsWith("[") && stripped.indexOf(':') >= 0;
        return bareIpv6 ? "[" + stripped + "]" : stripped;
    }

    private static Set<String> normalize(List<String> values, boolean origin) {
        return values.stream()
                .map(String::trim)
                .filter(v -> !v.isEmpty())
                .map(v -> v.toLowerCase(Locale.ROOT))
                .map(v -> origin ? trimSlash(v) : normalizeHost(v))
                .collect(Collectors.toUnmodifiableSet());
    }

    private static String trimSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
