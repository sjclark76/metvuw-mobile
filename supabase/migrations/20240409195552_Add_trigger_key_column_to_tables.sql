alter table "public"."images_to_remove" add column "trigger_key" text not null;

alter table "public"."images_to_upload" add column "trigger_key" text not null;

alter table "public"."trigger" add column "trigger_key" text not null;


