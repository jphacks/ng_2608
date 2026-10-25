ALTER TABLE profiles ADD COLUMN value_summary text NOT NULL DEFAULT '{}';
--> statement-breakpoint
CREATE TABLE insight_consents (
 source text NOT NULL, target text NOT NULL, enabled integer NOT NULL DEFAULT 0,
 PRIMARY KEY(source,target)
);
--> statement-breakpoint
CREATE TABLE insight_facts (
 source text NOT NULL, target text NOT NULL, dimension text NOT NULL,
 values_json text NOT NULL, message_id text NOT NULL, quote text NOT NULL, updated_at integer NOT NULL,
 PRIMARY KEY(source,target,dimension)
);
