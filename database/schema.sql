CREATE DATABASE IF NOT EXISTS cost_center_db;
USE cost_center_db;

CREATE TABLE IF NOT EXISTS cost_centers (
  sys_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(250) NOT NULL,
  activation_deactivation_yn VARCHAR(10) NOT NULL DEFAULT 'N',
  activation_deactivation_sys_id BIGINT UNSIGNED NULL,
  activation_deactivation_code VARCHAR(100) NULL,
  activation_deactivation_name VARCHAR(250) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (sys_id),
  UNIQUE KEY uq_cost_center_code (code)
);

CREATE TABLE IF NOT EXISTS applicable_companies (
  sys_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cost_center_sys_id BIGINT UNSIGNED NOT NULL,
  company_sys_id BIGINT UNSIGNED NOT NULL,
  company_code VARCHAR(100) NOT NULL,
  company_name VARCHAR(250) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sys_id),
  KEY idx_applicable_cost_center (cost_center_sys_id),
  CONSTRAINT fk_applicable_cost_center
    FOREIGN KEY (cost_center_sys_id) REFERENCES cost_centers(sys_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS activation_deactivation_master (
  sys_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(250) NOT NULL,
  PRIMARY KEY (sys_id),
  UNIQUE KEY uq_activation_code (code)
);

CREATE TABLE IF NOT EXISTS companies (
  sys_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(250) NOT NULL,
  PRIMARY KEY (sys_id),
  UNIQUE KEY uq_company_code (code)
);

INSERT INTO activation_deactivation_master (code, name)
VALUES
  ('ACT', 'Active'),
  ('DEA', 'Deactivated')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO companies (code, name)
VALUES
  ('SHJ', 'FARATH ALMAZNI GOODS WHOLESALERS LLC - SHJ'),
  ('DXB', 'FARATH ALMAZNI GOODS WHOLESALERS LLC - DXB'),
  ('AUH', 'FARATH ALMAZNI GOODS WHOLESALERS LLC - AUH')
ON DUPLICATE KEY UPDATE name = VALUES(name);
