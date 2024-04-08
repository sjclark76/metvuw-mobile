CREATE OR REPLACE FUNCTION call_web_trigger_api()
RETURNS TRIGGER AS $$
BEGIN

    PERFORM
        net.http_post(
                NEW.host_name || '/api/run-web-trigger' ::text,
                jsonb_build_object(
                        'old_record', OLD,
                        'record', NEW,
                        'type', TG_OP,
                        'table', TG_TABLE_NAME,
                        'schema', TG_TABLE_SCHEMA
                ),
                '{}' ::jsonb,
                json_build_object('Content-type', 'application/json') ::jsonb,
                10000 ::integer
        );

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER call_web_trigger_api
    AFTER INSERT ON public.trigger
    FOR EACH ROW EXECUTE FUNCTION call_web_trigger_api();