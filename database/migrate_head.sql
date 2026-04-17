-- Add head_staff_id to DEPARTMENT (run once)
ALTER TABLE DEPARTMENT
  ADD COLUMN IF NOT EXISTS head_staff_id INT NULL,
  ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_staff_id) REFERENCES STAFF(staff_id) ON DELETE SET NULL;
