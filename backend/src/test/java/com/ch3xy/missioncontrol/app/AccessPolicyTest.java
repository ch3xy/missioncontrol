package com.ch3xy.missioncontrol.app;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AccessPolicyTest {

    private final AccessPolicy policy = new AccessPolicy(
            List.of("arrow.local", " Pi.TAIL1234.ts.net "),
            List.of("https://arrow.local/", "http://localhost:4200"));

    @Test
    void loopbackHostsAreAlwaysAllowed() {
        assertThat(policy.isHostAllowed("localhost:8082")).isTrue();
        assertThat(policy.isHostAllowed("127.0.0.1")).isTrue();
        assertThat(policy.isHostAllowed("[::1]:8082")).isTrue();
    }

    @Test
    void configuredHostsAreMatchedIgnoringCaseAndPort() {
        assertThat(policy.isHostAllowed("arrow.local")).isTrue();
        assertThat(policy.isHostAllowed("ARROW.local:443")).isTrue();
        assertThat(policy.isHostAllowed("pi.tail1234.ts.net")).isTrue();
    }

    @Test
    void foreignOrMissingHostsAreRejected() {
        assertThat(policy.isHostAllowed("evil.example")).isFalse();
        assertThat(policy.isHostAllowed("arrow.local.evil.example")).isFalse();
        assertThat(policy.isHostAllowed("192.168.1.50")).isFalse();
        assertThat(policy.isHostAllowed("")).isFalse();
        assertThat(policy.isHostAllowed(null)).isFalse();
    }

    @Test
    void originIsOptionalButMustMatchWhenPresent() {
        assertThat(policy.isOriginAllowed(null)).isTrue();
        assertThat(policy.isOriginAllowed("https://arrow.local")).isTrue();
        assertThat(policy.isOriginAllowed("HTTPS://Arrow.local/")).isTrue();
        assertThat(policy.isOriginAllowed("http://localhost:4200")).isTrue();
    }

    @Test
    void foreignOriginsAreRejected() {
        assertThat(policy.isOriginAllowed("https://evil.example")).isFalse();
        // Same host, other scheme or port is a different origin
        assertThat(policy.isOriginAllowed("http://arrow.local")).isFalse();
        assertThat(policy.isOriginAllowed("http://localhost:4201")).isFalse();
        assertThat(policy.isOriginAllowed("null")).isFalse();
        assertThat(policy.isOriginAllowed("")).isFalse();
    }

    @Test
    void emptyConfigurationAllowsOnlyLoopbackAndNoOrigins() {
        AccessPolicy empty = new AccessPolicy(List.of(), List.of());

        assertThat(empty.isHostAllowed("localhost")).isTrue();
        assertThat(empty.isHostAllowed("arrow.local")).isFalse();
        assertThat(empty.isOriginAllowed("https://arrow.local")).isFalse();
    }

    @Test
    void ipv6HostsAreComparedInBracketedForm() {
        AccessPolicy ipv6 = new AccessPolicy(List.of("[fe80::1]", "fe80::2", "[fe80::3]:8082"), List.of());

        assertThat(ipv6.isHostAllowed("[fe80::1]:8082")).isTrue();
        assertThat(ipv6.isHostAllowed("[fe80::2]:8082")).isTrue();
        assertThat(ipv6.isHostAllowed("[fe80::3]")).isTrue();
        assertThat(ipv6.isHostAllowed("[fe80::4]:8082")).isFalse();
        // A bare IPv6 address is not a valid Host header and must not match by being cut at a colon
        assertThat(ipv6.isHostAllowed("fe80::1")).isFalse();
        assertThat(ipv6.isHostAllowed("fe80")).isFalse();
    }

    @Test
    void stripPortLeavesBareIpv6Untouched() {
        assertThat(AccessPolicy.stripPort("fe80::1")).isEqualTo("fe80::1");
        assertThat(AccessPolicy.stripPort("[fe80::1]:8082")).isEqualTo("[fe80::1]");
        assertThat(AccessPolicy.stripPort("arrow.local:443")).isEqualTo("arrow.local");
    }
}
