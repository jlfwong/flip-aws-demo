create table "public"."flip_commands" (
    "id" character varying not null,
    "flip_device_id" character varying not null,
    "created_at" timestamp with time zone not null default now(),
    "device_acked_at" timestamp with time zone,
    "event_payload" json not null
);


alter table "public"."flip_commands" enable row level security;

alter table "public"."devices" alter column "flip_device_id" set data type text using "flip_device_id"::text;

CREATE UNIQUE INDEX devices_flip_device_id_key ON public.devices USING btree (flip_device_id);

CREATE UNIQUE INDEX flip_commands_pkey ON public.flip_commands USING btree (id);

alter table "public"."flip_commands" add constraint "flip_commands_pkey" PRIMARY KEY using index "flip_commands_pkey";

alter table "public"."devices" add constraint "devices_flip_device_id_key" UNIQUE using index "devices_flip_device_id_key";

alter table "public"."flip_commands" add constraint "flip_webhook_events_device_id_fkey" FOREIGN KEY (flip_device_id) REFERENCES devices(flip_device_id) not valid;

alter table "public"."flip_commands" validate constraint "flip_webhook_events_device_id_fkey";

grant delete on table "public"."flip_commands" to "anon";

grant insert on table "public"."flip_commands" to "anon";

grant references on table "public"."flip_commands" to "anon";

grant select on table "public"."flip_commands" to "anon";

grant trigger on table "public"."flip_commands" to "anon";

grant truncate on table "public"."flip_commands" to "anon";

grant update on table "public"."flip_commands" to "anon";

grant delete on table "public"."flip_commands" to "authenticated";

grant insert on table "public"."flip_commands" to "authenticated";

grant references on table "public"."flip_commands" to "authenticated";

grant select on table "public"."flip_commands" to "authenticated";

grant trigger on table "public"."flip_commands" to "authenticated";

grant truncate on table "public"."flip_commands" to "authenticated";

grant update on table "public"."flip_commands" to "authenticated";

grant delete on table "public"."flip_commands" to "service_role";

grant insert on table "public"."flip_commands" to "service_role";

grant references on table "public"."flip_commands" to "service_role";

grant select on table "public"."flip_commands" to "service_role";

grant trigger on table "public"."flip_commands" to "service_role";

grant truncate on table "public"."flip_commands" to "service_role";

grant update on table "public"."flip_commands" to "service_role";



