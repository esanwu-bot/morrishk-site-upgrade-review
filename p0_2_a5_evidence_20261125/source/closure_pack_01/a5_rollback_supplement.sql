-- ============================================================================
-- A.5 ROLLBACK SUPPLEMENT TEST  (STATUS: NOT EXECUTED)
-- ----------------------------------------------------------------------------
-- This file is a PREPARED test plan. It MUST NOT be executed until the Owner
-- gives explicit authorization for an isolated MySQL 8.4 test instance.
--
-- Scope: bidirectional rollback evidence for D-1 A.5:
--   pre-transaction count = 0
--   in-transaction count  = 1 (uncommitted insert visible on same connection)
--   post-ROLLBACK count   = 0
--
-- Isolation rules:
--   * dedicated database p02_a5_rollback_test
--   * isolated instance only (127.0.0.1), never production
--   * no production DDL / migration / business data
-- ============================================================================

SELECT '=== A5 ENV ===' AS section;
SELECT VERSION() AS mysql_version,
       @@version_comment AS version_comment,
       @@character_set_server AS charset_server,
       @@collation_server AS collation_server;

DROP DATABASE IF EXISTS p02_a5_rollback_test;
CREATE DATABASE p02_a5_rollback_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs;
USE p02_a5_rollback_test;

CREATE TABLE t_rollback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mpn_norm VARCHAR(128) NOT NULL,
  brand_norm VARCHAR(128) NOT NULL,
  UNIQUE KEY uk_identity (mpn_norm, brand_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

SELECT '=== A5 PRE (expect 0) ===' AS section;
SELECT COUNT(*) AS pre_count FROM t_rollback WHERE mpn_norm='A5-1' AND brand_norm='BrandX';

START TRANSACTION;
INSERT INTO t_rollback(mpn_norm, brand_norm) VALUES ('A5-1','BrandX');

SELECT '=== A5 IN-TXN (expect 1) ===' AS section;
SELECT COUNT(*) AS in_txn_count FROM t_rollback WHERE mpn_norm='A5-1' AND brand_norm='BrandX';

ROLLBACK;

SELECT '=== A5 POST (expect 0) ===' AS section;
SELECT COUNT(*) AS post_count FROM t_rollback WHERE mpn_norm='A5-1' AND brand_norm='BrandX';

SELECT '=== DONE ===' AS section;
