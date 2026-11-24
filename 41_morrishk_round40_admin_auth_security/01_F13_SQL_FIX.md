# 01 F-13：后台导航 SQL 修复

## 1. 缺陷定位

| 项 | 内容 |
|---|---|
| 入口 | 登录后 `GET /ejadmin-index.html` → 500 |
| 文件 | `modules/ejadmin/views/layouts/header.php:26` |
| 原 SQL | ``SELECT `Pid` FROM `snsii_nav` WHERE `id` IN (11,12) GROUP BY `Pid` ORDER BY `id` `` |
| 错误 | `SQLSTATE 42000 / 1055`：`ORDER BY snsii_nav.id` 不在 `GROUP BY` 中，违反 `ONLY_FULL_GROUP_BY` |
| 影响 | 后台所有使用该布局的页面 500 |

修复前后 SQL 与错误原文：`evidence/f13_sql_repro.txt`；修复前 500 日志见 Round 39.2 的 `f13_admin_nav_groupby.txt`。

## 2. 业务语义

- `NavList`（`snsii_manage.NavList` JSON）保存该账号**可见的子菜单 id**。
- 菜单结构：`snsii_nav.Pid` 指向父菜单 `id`。
- 原查询意图：取可见子菜单对应的**去重父 id 列表**，并按父菜单顺序稳定排列。
- 原写法 `GROUP BY Pid ORDER BY id` 中，`id` 不在分组内，MySQL 5.7+ 严格模式下被拒绝；即使宽松模式，排序值也来自被折叠的任意行，不确定。

## 3. 修复

```php
// before
->select('Pid')->where(['in','id',$NavListId])->groupBy('Pid')->orderBy('id')
// after
->select('Pid')->where(['in','id',$NavListId])->groupBy('Pid')->orderBy('Pid')
```

- 保留 `GROUP BY` 去重语义；
- 排序改为分组键 `Pid` 本身，结果确定且与后续 `$tempA = ... orderBy('id')` 的父级顺序一致（父子 id 同序）；
- 未关闭 `ONLY_FULL_GROUP_BY`，未删除排序，未使用 `MIN/MAX` 代替业务顺序；
- 子菜单查询本身为 `ORDER BY id`，不受影响。

## 4. 菜单数据关系与去重

- 一个父菜单可对应多个子菜单；同一子菜单只属于一个父级（`Pid` 单值），因此 `GROUP BY Pid` 后的父列表天然无重复。
- 父子关系由 `Pid` 唯一确定，子菜单通过 `Pid = 父 id AND id IN NavList` 选取，不会跨父级重复。
- 排序确定性：父菜单按 `id`、子菜单按 `id`，两次请求导航片段完全一致（已验证）。

## 5. 验证（PHP 8.5.13 / MySQL 8.4.13，`ONLY_FULL_GROUP_BY` 保持开启）

| 场景 | 结果 |
|---|---|
| 员工登录后 `/ejadmin-index.html` | **200** |
| 管理员登录后 `/ejadmin-index.html` | **200** |
| 员工菜单 | 仅 `Products > Product List / Categories` |
| 管理员菜单 | `Products / Content / Settings` 及其全部子项 |
| 无权限项暴露 | `News`、`Accounts` 在员工页面 **absent** |
| 重复菜单 | 无 |
| 父子顺序 | 父项均出现在子项之前 |
| 排序稳定性 | 两次请求的导航片段 `identical-nav-fragment` |

原始输出：`evidence/regression_matrix.txt`。
