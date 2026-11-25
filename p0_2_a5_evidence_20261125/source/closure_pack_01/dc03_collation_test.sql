-- ============================================================================
-- DC-03 / D-1 Collation verification (isolated MySQL 8.4 test instance)
-- Scope: utf8mb4_0900_as_cs vs utf8mb4_bin vs utf8mb4_0900_bin vs utf8mb4_0900_ai_ci
-- Isolation: named-pipe only, --skip-networking, dedicated database p02_collation_test
-- NOTE: read-only for business data; only creates/drops a temporary test database.
-- ============================================================================

SELECT '=== ENV ===' AS section;
SELECT VERSION() AS mysql_version,
       @@version_comment AS version_comment,
       @@character_set_server AS charset_server,
       @@collation_server AS collation_server,
       @@skip_networking AS skip_networking;

SELECT '=== COLLATIONS METADATA ===' AS section;
SHOW COLLATION WHERE Charset = 'utf8mb4'
  AND Collation IN ('utf8mb4_0900_as_cs','utf8mb4_bin','utf8mb4_0900_bin','utf8mb4_0900_ai_ci');

DROP DATABASE IF EXISTS p02_collation_test;
CREATE DATABASE p02_collation_test CHARACTER SET utf8mb4;
USE p02_collation_test;

CREATE TABLE t_0900_as_cs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mpn_norm VARCHAR(128) NOT NULL,
  brand_norm VARCHAR(128) NOT NULL,
  note VARCHAR(64) NULL,
  UNIQUE KEY uk_identity (mpn_norm, brand_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE t_bin LIKE t_0900_as_cs;
ALTER TABLE t_bin CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;

CREATE TABLE t_0900_bin LIKE t_0900_as_cs;
ALTER TABLE t_0900_bin CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin;

CREATE TABLE t_0900_ai_ci LIKE t_0900_as_cs;
ALTER TABLE t_0900_ai_ci CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

SELECT '=== TABLE COLLATIONS ===' AS section;
SELECT TABLE_NAME, TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA='p02_collation_test' ORDER BY TABLE_NAME;

-- ----------------------------------------------------------------------------
-- CASE 1: exact baseline insert (expected: success in all 4)
-- ----------------------------------------------------------------------------
SELECT '=== CASE-1 exact baseline: ABC-1 / BrandX ===' AS section;
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('ABC-1','BrandX','base');
INSERT INTO t_bin(mpn_norm,brand_norm,note)       VALUES ('ABC-1','BrandX','base');
INSERT INTO t_0900_bin(mpn_norm,brand_norm,note)  VALUES ('ABC-1','BrandX','base');
INSERT INTO t_0900_ai_ci(mpn_norm,brand_norm,note)VALUES ('ABC-1','BrandX','base');
SELECT 'CASE-1 done' AS marker;

-- ----------------------------------------------------------------------------
-- CASE 2: case sensitivity (abc-1 vs ABC-1)
-- expected: as_cs/bin/0900_bin = success (distinct); ai_ci = duplicate(1062)
-- ----------------------------------------------------------------------------
SELECT '=== CASE-2 case variant: abc-1 / BrandX ===' AS section;
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('abc-1','BrandX','case');
INSERT INTO t_bin(mpn_norm,brand_norm,note)       VALUES ('abc-1','BrandX','case');
INSERT INTO t_0900_bin(mpn_norm,brand_norm,note)  VALUES ('abc-1','BrandX','case');
INSERT INTO t_0900_ai_ci(mpn_norm,brand_norm,note)VALUES ('abc-1','BrandX','case');
SELECT 'CASE-2 done' AS marker;

-- ----------------------------------------------------------------------------
-- CASE 3: accent sensitivity (e vs é)
-- expected: as_cs/bin/0900_bin = distinct; ai_ci = duplicate(1062)
-- ----------------------------------------------------------------------------
SELECT '=== CASE-3 accent: e vs é ===' AS section;
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('e','BrandX','accent-base');
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('é','BrandX','accent-variant');
INSERT INTO t_bin(mpn_norm,brand_norm,note)       VALUES ('e','BrandX','accent-base');
INSERT INTO t_bin(mpn_norm,brand_norm,note)       VALUES ('é','BrandX','accent-variant');
INSERT INTO t_0900_bin(mpn_norm,brand_norm,note)  VALUES ('e','BrandX','accent-base');
INSERT INTO t_0900_bin(mpn_norm,brand_norm,note)  VALUES ('é','BrandX','accent-variant');
INSERT INTO t_0900_ai_ci(mpn_norm,brand_norm,note)VALUES ('e','BrandX','accent-base');
INSERT INTO t_0900_ai_ci(mpn_norm,brand_norm,note)VALUES ('é','BrandX','accent-variant');
SELECT 'CASE-3 done' AS marker;

-- ----------------------------------------------------------------------------
-- CASE 4: trailing space (ABC-2 vs 'ABC-2 ')
-- expected: 0900_* (NO PAD) = distinct; utf8mb4_bin (PAD SPACE) = duplicate(1062)
-- ----------------------------------------------------------------------------
SELECT '=== CASE-4 trailing space: ABC-2 vs ABC-2 + space ===' AS section;
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('ABC-2','BrandX','no-space');
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('ABC-2 ','BrandX','trailing-space');
INSERT INTO t_bin(mpn_norm,brand_norm,note)       VALUES ('ABC-2','BrandX','no-space');
INSERT INTO t_bin(mpn_norm,brand_norm,note)       VALUES ('ABC-2 ','BrandX','trailing-space');
INSERT INTO t_0900_bin(mpn_norm,brand_norm,note)  VALUES ('ABC-2','BrandX','no-space');
INSERT INTO t_0900_bin(mpn_norm,brand_norm,note)  VALUES ('ABC-2 ','BrandX','trailing-space');
INSERT INTO t_0900_ai_ci(mpn_norm,brand_norm,note)VALUES ('ABC-2','BrandX','no-space');
INSERT INTO t_0900_ai_ci(mpn_norm,brand_norm,note)VALUES ('ABC-2 ','BrandX','trailing-space');
SELECT 'CASE-4 done' AS marker;

-- ----------------------------------------------------------------------------
-- CASE 5: composite key, same MPN different Brand (expected: success all 4)
-- ----------------------------------------------------------------------------
SELECT '=== CASE-5 composite: SAME / BrandA vs SAME / BrandB ===' AS section;
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('SAME','BrandA','multi-brand-A');
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('SAME','BrandB','multi-brand-B');
INSERT INTO t_bin(mpn_norm,brand_norm,note)       VALUES ('SAME','BrandA','multi-brand-A');
INSERT INTO t_bin(mpn_norm,brand_norm,note)       VALUES ('SAME','BrandB','multi-brand-B');
INSERT INTO t_0900_bin(mpn_norm,brand_norm,note)  VALUES ('SAME','BrandA','multi-brand-A');
INSERT INTO t_0900_bin(mpn_norm,brand_norm,note)  VALUES ('SAME','BrandB','multi-brand-B');
INSERT INTO t_0900_ai_ci(mpn_norm,brand_norm,note)VALUES ('SAME','BrandA','multi-brand-A');
INSERT INTO t_0900_ai_ci(mpn_norm,brand_norm,note)VALUES ('SAME','BrandB','multi-brand-B');
SELECT 'CASE-5 done' AS marker;

-- ----------------------------------------------------------------------------
-- CASE 6: exact duplicate (expected: duplicate 1062 in all 4)
-- ----------------------------------------------------------------------------
SELECT '=== CASE-6 exact duplicate: ABC-1 / BrandX again ===' AS section;
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('ABC-1','BrandX','dup');
INSERT INTO t_bin(mpn_norm,brand_norm,note)       VALUES ('ABC-1','BrandX','dup');
INSERT INTO t_0900_bin(mpn_norm,brand_norm,note)  VALUES ('ABC-1','BrandX','dup');
INSERT INTO t_0900_ai_ci(mpn_norm,brand_norm,note)VALUES ('ABC-1','BrandX','dup');
SELECT 'CASE-6 done' AS marker;

-- ----------------------------------------------------------------------------
-- CASE 7: transaction rollback (expected: row count 0 after rollback)
-- ----------------------------------------------------------------------------
SELECT '=== CASE-7 transaction rollback ===' AS section;
START TRANSACTION;
INSERT INTO t_0900_as_cs(mpn_norm,brand_norm,note) VALUES ('ROLLBACK-1','BrandX','rollback');
ROLLBACK;
SELECT COUNT(*) AS rollback_remaining FROM t_0900_as_cs WHERE mpn_norm='ROLLBACK-1';
SELECT 'CASE-7 done' AS marker;

-- ----------------------------------------------------------------------------
-- CASE 8: index metadata / DDL
-- ----------------------------------------------------------------------------
SELECT '=== CASE-8 index metadata ===' AS section;
SHOW INDEX FROM t_0900_as_cs;
SHOW CREATE TABLE t_0900_as_cs;
EXPLAIN SELECT * FROM t_0900_as_cs WHERE mpn_norm='ABC-1' AND brand_norm='BrandX';

-- ----------------------------------------------------------------------------
-- CASE 9: final row counts and samples
-- ----------------------------------------------------------------------------
SELECT '=== CASE-9 row counts ===' AS section;
SELECT 't_0900_as_cs' AS t, COUNT(*) AS n FROM t_0900_as_cs
UNION ALL SELECT 't_bin', COUNT(*) FROM t_bin
UNION ALL SELECT 't_0900_bin', COUNT(*) FROM t_0900_bin
UNION ALL SELECT 't_0900_ai_ci', COUNT(*) FROM t_0900_ai_ci;

SELECT '=== CASE-9 samples (as_cs) ===' AS section;
SELECT id, mpn_norm, brand_norm, note FROM t_0900_as_cs ORDER BY id;

SELECT '=== DONE ===' AS section;
