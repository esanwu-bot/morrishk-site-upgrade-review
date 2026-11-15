<?php
// 召回率自检夹具：每行 1 个「PHP 8.0 已移除」构造，共 20 处。
// 期望：扫描器 20/20 全部命中 BLOCKER。任一漏报说明规则表有盲区。

$r1  = each($arr);
$r2  = create_function('$a', 'return $a;');
function __autoload($class) { return 1; }
$r4  = mysql_query('SELECT 1');
$r5  = mcrypt_encrypt(MCRYPT_RIJNDAEL_128, $k, $d, MCRYPT_MODE_ECB);
$r6  = ereg('^a', $s);
$r7  = split(',', $s);
$r8  = money_format('%i', 1.5);
$r9  = utf8_encode($s);
$r10 = strftime('%Y', time());
$r11 = get_magic_quotes_gpc();
$r12 = hebrevc($s);
restore_include_path();
$r14 = fgetss($fp);
$r15 = image2wbmp($im);
$r16 = ezmlm_hash('a@b.c');
$r17 = (real)$n;
$r18 = $str{0};
$r19 = preg_replace('/a/e', 'strtoupper("$1")', $s);
parse_str($qs);
function bad_sig($opt = 1, $req) { return $req; }
