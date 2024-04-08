create table "public"."images_to_remove" (
    "created_at" timestamp with time zone not null default now(),
    "full_storage_path" text not null,
    "bucket_id" text not null
);


alter table "public"."images_to_remove" enable row level security;

create table "public"."images_to_upload" (
    "created_at" timestamp with time zone not null default now(),
    "original_image_url" text not null,
    "bucket_id" text not null,
    "full_storage_path" text not null,
    "small_image_storagePath" text,
    "chart_type" text not null
);


alter table "public"."images_to_upload" enable row level security;

create table "public"."trigger" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "operation_name" text not null,
    "is_completed" boolean not null default false,
    "host_name" text not null default 'http://localhost:3002'::text
);


alter table "public"."trigger" enable row level security;

CREATE UNIQUE INDEX images_to_remove_pkey ON public.images_to_remove USING btree (full_storage_path, bucket_id);

CREATE UNIQUE INDEX images_to_upload_pkey ON public.images_to_upload USING btree (bucket_id, full_storage_path);

CREATE UNIQUE INDEX trigger_pkey ON public.trigger USING btree (id);

alter table "public"."images_to_remove" add constraint "images_to_remove_pkey" PRIMARY KEY using index "images_to_remove_pkey";

alter table "public"."images_to_upload" add constraint "images_to_upload_pkey" PRIMARY KEY using index "images_to_upload_pkey";

alter table "public"."trigger" add constraint "trigger_pkey" PRIMARY KEY using index "trigger_pkey";

grant delete on table "public"."images_to_remove" to "anon";

grant insert on table "public"."images_to_remove" to "anon";

grant references on table "public"."images_to_remove" to "anon";

grant select on table "public"."images_to_remove" to "anon";

grant trigger on table "public"."images_to_remove" to "anon";

grant truncate on table "public"."images_to_remove" to "anon";

grant update on table "public"."images_to_remove" to "anon";

grant delete on table "public"."images_to_remove" to "authenticated";

grant insert on table "public"."images_to_remove" to "authenticated";

grant references on table "public"."images_to_remove" to "authenticated";

grant select on table "public"."images_to_remove" to "authenticated";

grant trigger on table "public"."images_to_remove" to "authenticated";

grant truncate on table "public"."images_to_remove" to "authenticated";

grant update on table "public"."images_to_remove" to "authenticated";

grant delete on table "public"."images_to_remove" to "service_role";

grant insert on table "public"."images_to_remove" to "service_role";

grant references on table "public"."images_to_remove" to "service_role";

grant select on table "public"."images_to_remove" to "service_role";

grant trigger on table "public"."images_to_remove" to "service_role";

grant truncate on table "public"."images_to_remove" to "service_role";

grant update on table "public"."images_to_remove" to "service_role";

grant delete on table "public"."images_to_upload" to "anon";

grant insert on table "public"."images_to_upload" to "anon";

grant references on table "public"."images_to_upload" to "anon";

grant select on table "public"."images_to_upload" to "anon";

grant trigger on table "public"."images_to_upload" to "anon";

grant truncate on table "public"."images_to_upload" to "anon";

grant update on table "public"."images_to_upload" to "anon";

grant delete on table "public"."images_to_upload" to "authenticated";

grant insert on table "public"."images_to_upload" to "authenticated";

grant references on table "public"."images_to_upload" to "authenticated";

grant select on table "public"."images_to_upload" to "authenticated";

grant trigger on table "public"."images_to_upload" to "authenticated";

grant truncate on table "public"."images_to_upload" to "authenticated";

grant update on table "public"."images_to_upload" to "authenticated";

grant delete on table "public"."images_to_upload" to "service_role";

grant insert on table "public"."images_to_upload" to "service_role";

grant references on table "public"."images_to_upload" to "service_role";

grant select on table "public"."images_to_upload" to "service_role";

grant trigger on table "public"."images_to_upload" to "service_role";

grant truncate on table "public"."images_to_upload" to "service_role";

grant update on table "public"."images_to_upload" to "service_role";

grant delete on table "public"."trigger" to "anon";

grant insert on table "public"."trigger" to "anon";

grant references on table "public"."trigger" to "anon";

grant select on table "public"."trigger" to "anon";

grant trigger on table "public"."trigger" to "anon";

grant truncate on table "public"."trigger" to "anon";

grant update on table "public"."trigger" to "anon";

grant delete on table "public"."trigger" to "authenticated";

grant insert on table "public"."trigger" to "authenticated";

grant references on table "public"."trigger" to "authenticated";

grant select on table "public"."trigger" to "authenticated";

grant trigger on table "public"."trigger" to "authenticated";

grant truncate on table "public"."trigger" to "authenticated";

grant update on table "public"."trigger" to "authenticated";

grant delete on table "public"."trigger" to "service_role";

grant insert on table "public"."trigger" to "service_role";

grant references on table "public"."trigger" to "service_role";

grant select on table "public"."trigger" to "service_role";

grant trigger on table "public"."trigger" to "service_role";

grant truncate on table "public"."trigger" to "service_role";

grant update on table "public"."trigger" to "service_role";

