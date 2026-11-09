package com.ch3xy.missioncontrol.settings;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppSettingsRepository extends JpaRepository<AppSetting, String> {}
