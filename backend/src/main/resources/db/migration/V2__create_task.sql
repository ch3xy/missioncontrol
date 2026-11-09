-- Daily plan: a task is planned for a day (plan_date) or waits in the brain dump (plan_date null).
-- position orders the tasks within one day or the brain dump; estimate_minutes is optional.
create table task (
    id               uuid         primary key,
    title            varchar(200) not null,
    estimate_minutes integer      check (estimate_minutes is null or estimate_minutes between 1 and 1440),
    status           varchar(20)  not null check (status in ('OPEN', 'IN_PROGRESS', 'DONE')),
    plan_date        date,
    position         integer      not null,
    created_at       timestamptz  not null,
    updated_at       timestamptz  not null,
    done_at          timestamptz,
    -- Optimistic locking: an update must name the version it is based on (409 otherwise)
    version          integer      not null default 0
);

create index task_plan_date_position_idx on task (plan_date, position);
