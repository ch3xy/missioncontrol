-- Key/value settings of the single user, same shape as dash. Empty strings are valid values
-- (optional fields), so there is no length check on value.
create table app_settings (
    key   varchar(100) primary key,
    value text         not null
);

-- Defaults mirror DEFAULT_SETTINGS of the frontend (src/app/core/models/settings.model.ts)
insert into app_settings (key, value) values
    ('velo_url',             'http://localhost:4201'),
    ('dash_url',             'http://localhost:4202'),
    ('sevdesk_url',          'https://my.sevdesk.de'),
    ('calendar_source',      'none'),
    ('calendar_source_url',  ''),
    ('velo_source_url',      ''),
    ('dash_source_url',      ''),
    ('velo_api_url',         ''),
    ('dash_api_url',         ''),
    ('daily_target_hours',   '8'),
    ('auto_refresh_minutes', '5'),
    ('local_tool_1_label',   'Local Tool 1'),
    ('local_tool_1_url',     ''),
    ('local_tool_2_label',   'Local Tool 2'),
    ('local_tool_2_url',     '');
