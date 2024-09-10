create table "public"."devices" (
    "aws_thing_name" character varying not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp without time zone not null default now(),
    "flip_device_id" character varying not null,
    "flip_site_id" character varying not null
);


alter table "public"."devices" enable row level security;

CREATE UNIQUE INDEX devices_pkey ON public.devices USING btree (aws_thing_name);

alter table "public"."devices" add constraint "devices_pkey" PRIMARY KEY using index "devices_pkey";

alter table "public"."devices" add constraint "devices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."devices" validate constraint "devices_user_id_fkey";

grant delete on table "public"."devices" to "anon";

grant insert on table "public"."devices" to "anon";

grant references on table "public"."devices" to "anon";

grant select on table "public"."devices" to "anon";

grant trigger on table "public"."devices" to "anon";

grant truncate on table "public"."devices" to "anon";

grant update on table "public"."devices" to "anon";

grant delete on table "public"."devices" to "authenticated";

grant insert on table "public"."devices" to "authenticated";

grant references on table "public"."devices" to "authenticated";

grant select on table "public"."devices" to "authenticated";

grant trigger on table "public"."devices" to "authenticated";

grant truncate on table "public"."devices" to "authenticated";

grant update on table "public"."devices" to "authenticated";

grant delete on table "public"."devices" to "service_role";

grant insert on table "public"."devices" to "service_role";

grant references on table "public"."devices" to "service_role";

grant select on table "public"."devices" to "service_role";

grant trigger on table "public"."devices" to "service_role";

grant truncate on table "public"."devices" to "service_role";

grant update on table "public"."devices" to "service_role";

create policy "User can see and modify their own devices"
on "public"."devices"
as permissive
for all
to public
using ((( SELECT auth.uid() AS uid) = user_id));




