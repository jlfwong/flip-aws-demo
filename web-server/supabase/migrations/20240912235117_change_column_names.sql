alter table "public"."flip_commands" drop column "event_payload";

alter table "public"."flip_commands" add column "command_json" json not null;



