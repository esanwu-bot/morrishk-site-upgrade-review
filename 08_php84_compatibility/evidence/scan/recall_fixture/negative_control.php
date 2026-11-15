<?php
// 精确率自检夹具：以下 6 处都是「看起来像、实际不是」，扫描器不应报 BLOCKER。
// 任一误报说明 blank_noncode / mask_markup_scripts 有缺陷。

// 1) 注释里的调用：each($arr)
/* 2) 块注释里的 create_function() */
$s1 = "调用 each() 会报错";                 // 3) 字符串字面量
$s2 = 'mysql_query(';                       // 4) 字符串字面量
$obj->each($x);                              // 5) 对象方法，不是内建 each()
$parts = $someObject->split(',');            // 6) 对象方法
?>
<script>
  $('.row').each(function () { return $(this).text().split(','); });
</script>
