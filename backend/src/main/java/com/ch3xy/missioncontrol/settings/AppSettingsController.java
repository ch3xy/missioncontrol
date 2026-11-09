package com.ch3xy.missioncontrol.settings;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Settings", description = "Einstellungen von mission control: Links zu velo, dash und sevDesk, Datenquellen, Tagesziel und Auto-Refresh.")
@RestController
@RequestMapping("/api/v1/settings")
public class AppSettingsController {

    private final AppSettingsService service;

    public AppSettingsController(AppSettingsService service) {
        this.service = service;
    }

    @Operation(
            summary = "Alle Einstellungen abrufen",
            description = "Gibt die gespeicherten Einstellungen zurück. Ohne bisherige Änderung sind das die Standardwerte aus der ersten Migration."
    )
    @GetMapping
    public ResponseEntity<AppSettingsResponse> get() {
        return ResponseEntity.ok(service.getAll());
    }

    @Operation(
            summary = "Einstellungen aktualisieren",
            description = "Ersetzt alle Einstellungen mit den übermittelten Werten (PUT-Semantik). Optionale Felder werden als leerer String gesendet."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Einstellungen aktualisiert"),
            @ApiResponse(responseCode = "422", description = "Ungültige Werte, z. B. andere Schemas als http/https, unbekannte Kalenderquelle oder Tagesziel außerhalb von 0–24 Stunden")
    })
    @PutMapping
    public ResponseEntity<AppSettingsResponse> update(@Valid @RequestBody AppSettingsRequest req) {
        return ResponseEntity.ok(service.update(req));
    }
}
