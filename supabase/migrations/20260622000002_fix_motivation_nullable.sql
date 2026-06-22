-- motivation is optional in the product
-- align DB constraint with application behavior
ALTER TABLE job_applications
ALTER COLUMN motivation DROP NOT NULL;
