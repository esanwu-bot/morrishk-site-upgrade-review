-- ============================================================
-- morrishk.net 老站数据库结构（纯 DDL，不含任何业务数据）
-- 源文件: morris_2024-11-30_14-01-50_mysql_data_VsRoT.sql
-- 源库  : morris   源版本: MySQL 5.6.50-log (mysqldump 10.13)
-- SHA256: 7a59ac156676692fd39e4cc2ce0bda1a2039755d7e91bf9d06a31e0576266717
-- 表数量: 31
-- 说明  : 由流式扫描器逐语句重建，未做任何正则删除 INSERT 的二次加工
-- ============================================================

-- ---------- 原 dump 的头部会话设置 ----------
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- ---------- 表结构 ----------

DROP TABLE IF EXISTS `snsii_ad`;
CREATE TABLE `snsii_ad` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` varchar(200) NOT NULL COMMENT '广告名称',
  `Content` varchar(500) DEFAULT NULL COMMENT '广告描述',
  `Image` varchar(200) NOT NULL COMMENT '广告图片',
  `Links` varchar(200) NOT NULL COMMENT '链接地址',
  `Location` varchar(20) NOT NULL DEFAULT 'Home' COMMENT '广告位置',
  `OrderBy` int(5) NOT NULL COMMENT '排序',
  `Status` tinyint(1) NOT NULL COMMENT '是否显示',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_attr_name`;
CREATE TABLE `snsii_attr_name` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` varchar(100) NOT NULL COMMENT '名称',
  `EName` varchar(100) NOT NULL COMMENT '自定义名称',
  `Value` varchar(50) NOT NULL COMMENT '属性值',
  `Md5` char(32) NOT NULL COMMENT 'MD5',
  `IsPut` tinyint(1) NOT NULL DEFAULT '0' COMMENT '状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Md5` (`Md5`),
  KEY `IsPut` (`IsPut`)
) ENGINE=MyISAM AUTO_INCREMENT=1690 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_attr_name_lang`;
CREATE TABLE `snsii_attr_name_lang` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` varchar(100) NOT NULL COMMENT '名称',
  `Md5` char(32) NOT NULL COMMENT 'MD5',
  `Lang` char(5) NOT NULL COMMENT '语言代码',
  `IsPut` tinyint(1) NOT NULL DEFAULT '0' COMMENT '状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `LangMd5` (`Md5`,`Lang`) USING BTREE,
  KEY `IsPut` (`IsPut`),
  KEY `Lang` (`Lang`),
  KEY `Md5` (`Md5`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=33762 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_cart`;
CREATE TABLE `snsii_cart` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `AddDate` date NOT NULL COMMENT '时间',
  `Company` varchar(50) DEFAULT NULL COMMENT '公司名称',
  `Contact` varchar(50) NOT NULL COMMENT '联系人',
  `Phone` varchar(20) NOT NULL COMMENT '电话号码',
  `Fax` varchar(20) DEFAULT NULL COMMENT '传真号码',
  `Email` varchar(50) NOT NULL COMMENT '电子邮箱',
  `Country` varchar(50) DEFAULT NULL COMMENT '国家',
  `Address` varchar(200) DEFAULT NULL COMMENT '地址',
  `Product` text COMMENT '产品列表',
  `Content` text COMMENT '留言内容',
  `Files` varchar(200) NOT NULL COMMENT '附件',
  `IP` varchar(20) NOT NULL COMMENT '客户IP',
  `AddTime` int(11) NOT NULL DEFAULT '0' COMMENT '添加时间',
  `Url` varchar(200) NOT NULL COMMENT '网址',
  `Status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '状态',
  PRIMARY KEY (`id`),
  KEY `AddDate` (`AddDate`),
  KEY `Status` (`Status`)
) ENGINE=MyISAM AUTO_INCREMENT=2397 DEFAULT CHARSET=utf8 COMMENT='订单';


DROP TABLE IF EXISTS `snsii_cf_dns`;
CREATE TABLE `snsii_cf_dns` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `DnsId` char(50) NOT NULL COMMENT '域名解析Id',
  `Did` char(50) NOT NULL COMMENT '域名ID',
  `Name` varchar(100) NOT NULL COMMENT '别名',
  `Type` char(50) NOT NULL COMMENT '记录类型',
  `Content` varchar(500) NOT NULL COMMENT '记录值',
  `View` int(8) NOT NULL COMMENT '流量',
  `UserName` char(20) NOT NULL COMMENT '客户名称',
  PRIMARY KEY (`id`),
  UNIQUE KEY `DnsId` (`DnsId`),
  KEY `Did` (`Did`),
  KEY `View` (`View`),
  KEY `UserName` (`UserName`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_cf_domain`;
CREATE TABLE `snsii_cf_domain` (
  `id` int(6) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Did` char(50) NOT NULL COMMENT 'CF的ID',
  `Name` varchar(100) NOT NULL COMMENT '域名',
  `Status` char(20) NOT NULL COMMENT '状态',
  `View` int(8) NOT NULL COMMENT '流量',
  `UserName` char(20) NOT NULL COMMENT '客户名称',
  `NameServers` varchar(100) NOT NULL COMMENT 'DNS',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Did` (`Did`),
  KEY `View` (`View`),
  KEY `UserName` (`UserName`)
) ENGINE=MyISAM AUTO_INCREMENT=81 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_cf_logs`;
CREATE TABLE `snsii_cf_logs` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` varchar(50) NOT NULL COMMENT '域名',
  `Number` int(8) NOT NULL COMMENT '爬取量',
  `AddTime` date NOT NULL COMMENT '时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=14393 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_contact`;
CREATE TABLE `snsii_contact` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `UserName` varchar(50) NOT NULL COMMENT '用户名',
  `Email` varchar(50) NOT NULL DEFAULT '' COMMENT '邮箱',
  `Phone` varchar(20) NOT NULL COMMENT '电话',
  `Subject` varchar(50) DEFAULT NULL COMMENT '主题',
  `Message` text NOT NULL COMMENT '内容',
  `Url` varchar(100) NOT NULL COMMENT '来源',
  `AddTime` int(10) NOT NULL COMMENT '时间',
  `Status` tinyint(1) NOT NULL COMMENT '状态',
  PRIMARY KEY (`id`),
  KEY `Url` (`Url`),
  KEY `Status` (`Status`)
) ENGINE=MyISAM AUTO_INCREMENT=1606 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_info`;
CREATE TABLE `snsii_info` (
  `id` int(6) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Title` varchar(200) NOT NULL COMMENT '标题',
  `Keywords` varchar(120) DEFAULT NULL COMMENT '关键词',
  `Description` varchar(200) DEFAULT NULL COMMENT '描述',
  `CatId` int(3) NOT NULL DEFAULT '0' COMMENT '分类',
  `Links` varchar(120) NOT NULL COMMENT '连接',
  `IsHttp` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否外链',
  `Content` longtext COMMENT '内容',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Links` (`Links`),
  KEY `CatId` (`CatId`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_info_category`;
CREATE TABLE `snsii_info_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` varchar(100) NOT NULL COMMENT '分类',
  `Links` char(100) NOT NULL COMMENT '网址',
  `Status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Links` (`Links`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_language`;
CREATE TABLE `snsii_language` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(200) NOT NULL COMMENT '中文名',
  `EName` varchar(200) NOT NULL COMMENT '国家全称',
  `Domain` varchar(10) NOT NULL COMMENT '国际域名缩写',
  `CCode` varchar(20) NOT NULL COMMENT '国家代码',
  `Language` varchar(100) NOT NULL COMMENT '语言',
  `LangCode` varchar(11) CHARACTER SET armscii8 NOT NULL COMMENT '语言代码',
  `UrlA` varchar(50) NOT NULL COMMENT '绑定域名',
  `UrlB` varchar(50) DEFAULT NULL COMMENT '绑定域名B',
  `Pid` int(5) NOT NULL COMMENT '上级分类',
  `IsPut` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `IsPut` (`IsPut`),
  KEY `UrlB` (`UrlB`)
) ENGINE=MyISAM AUTO_INCREMENT=203 DEFAULT CHARSET=utf8 COMMENT='country-list';


DROP TABLE IF EXISTS `snsii_manage`;
CREATE TABLE `snsii_manage` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `UserName` varchar(20) NOT NULL COMMENT '用户名',
  `PassWord` varchar(100) NOT NULL COMMENT '密码',
  `Email` varchar(50) NOT NULL COMMENT '邮箱',
  `NickName` varchar(20) NOT NULL COMMENT '昵称',
  `NavList` text COMMENT '权限列表',
  `Avatar` varchar(200) DEFAULT NULL COMMENT '头像',
  `Role` int(3) NOT NULL DEFAULT '0' COMMENT '角色',
  `Status` int(5) NOT NULL DEFAULT '1' COMMENT '状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserName` (`UserName`) USING BTREE,
  UNIQUE KEY `Email` (`Email`) USING BTREE,
  KEY `Status` (`Status`),
  KEY `Role` (`Role`)
) ENGINE=MyISAM AUTO_INCREMENT=195 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_map`;
CREATE TABLE `snsii_map` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Url` varchar(200) NOT NULL COMMENT '网址',
  `Cat` char(50) NOT NULL COMMENT '类型',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Url` (`Url`)
) ENGINE=MyISAM AUTO_INCREMENT=10093674 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_nav`;
CREATE TABLE `snsii_nav` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` varchar(20) NOT NULL COMMENT '名称',
  `Icon` varchar(50) NOT NULL COMMENT '图标',
  `Links` varchar(50) NOT NULL COMMENT '链接',
  `Pid` int(5) NOT NULL COMMENT '上级',
  `Sort` int(5) NOT NULL COMMENT '排序',
  PRIMARY KEY (`id`),
  KEY `Pid` (`Pid`),
  KEY `Sort` (`Sort`)
) ENGINE=MyISAM AUTO_INCREMENT=94 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_news`;
CREATE TABLE `snsii_news` (
  `id` int(6) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Title` varchar(200) NOT NULL COMMENT '标题',
  `CatId` int(3) NOT NULL DEFAULT '0' COMMENT '分类',
  `Links` char(100) NOT NULL COMMENT '链接',
  `Keywords` varchar(100) NOT NULL COMMENT '关键词',
  `Description` varchar(200) NOT NULL COMMENT '描述',
  `Image` varchar(200) NOT NULL COMMENT '图片',
  `Content` longtext NOT NULL COMMENT '内容',
  `Views` int(5) NOT NULL COMMENT '浏览量',
  `Tags` varchar(200) DEFAULT NULL COMMENT '标签',
  `AddTime` int(11) NOT NULL COMMENT '添加时间',
  `IsHome` tinyint(1) NOT NULL DEFAULT '0' COMMENT '推荐',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Links` (`Links`),
  KEY `AddTime` (`AddTime`),
  KEY `CatId` (`CatId`),
  KEY `IsHome` (`IsHome`)
) ENGINE=MyISAM AUTO_INCREMENT=186 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_news_category`;
CREATE TABLE `snsii_news_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` varchar(100) NOT NULL COMMENT '分类',
  `Links` char(100) NOT NULL COMMENT '网址',
  `Status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Links` (`Links`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_news_tags`;
CREATE TABLE `snsii_news_tags` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` varchar(50) NOT NULL COMMENT '名称',
  `Links` varchar(50) NOT NULL COMMENT '链接',
  `Number` int(6) NOT NULL COMMENT '数量',
  PRIMARY KEY (`id`),
  KEY `Links` (`Links`)
) ENGINE=MyISAM AUTO_INCREMENT=94 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_news_tags_ids`;
CREATE TABLE `snsii_news_tags_ids` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Tid` int(6) NOT NULL COMMENT '标签ID',
  `Aid` int(6) NOT NULL COMMENT '文章ID',
  PRIMARY KEY (`id`),
  KEY `Tid` (`Tid`),
  KEY `Aid` (`Aid`)
) ENGINE=MyISAM AUTO_INCREMENT=306 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product`;
CREATE TABLE `snsii_product` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `PartNumber` varchar(50) NOT NULL COMMENT '型号',
  `PartUrl` varchar(50) NOT NULL COMMENT '型号URL',
  `BigCat` smallint(2) NOT NULL COMMENT '大类',
  `SmallCat` smallint(3) NOT NULL COMMENT '小类',
  `Mid` int(5) NOT NULL COMMENT '商家ID',
  `Description` varchar(100) NOT NULL COMMENT '描述',
  `Quantity` int(8) NOT NULL COMMENT '数量',
  `InStock` int(8) NOT NULL COMMENT '现货库存',
  `UnitPrice` decimal(10,5) NOT NULL COMMENT '单价',
  `ImgId` int(6) NOT NULL COMMENT '图片ID',
  `PdfId` int(6) NOT NULL DEFAULT '0' COMMENT 'PDFID',
  `DataAttr` text COMMENT '属性',
  `PriceNew` text COMMENT '新价格',
  `Md5` char(32) NOT NULL,
  `Image` varchar(200) DEFAULT NULL COMMENT '图片',
  `Pdf` varchar(200) DEFAULT NULL COMMENT 'PDF',
  `IsPut` tinyint(1) NOT NULL COMMENT '状态',
  `Lifecycle` tinyint(2) NOT NULL DEFAULT '1' COMMENT '生命周期',
  `RoHS` tinyint(2) NOT NULL DEFAULT '1' COMMENT 'RoHS',
  PRIMARY KEY (`id`),
  UNIQUE KEY `PartNumber` (`PartNumber`),
  UNIQUE KEY `Md5` (`Md5`),
  KEY `BigCat` (`BigCat`),
  KEY `SmallCat` (`SmallCat`),
  KEY `Mid` (`Mid`),
  KEY `ImgId` (`ImgId`),
  KEY `PartUrl` (`PartUrl`) USING BTREE,
  KEY `IsPut` (`IsPut`),
  KEY `PdfId` (`PdfId`)
) ENGINE=MyISAM AUTO_INCREMENT=10093686 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_cache`;
CREATE TABLE `snsii_product_cache` (
  `ProId` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Json` longtext COMMENT '内容',
  PRIMARY KEY (`ProId`)
) ENGINE=MyISAM AUTO_INCREMENT=10093685 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_cache_copy1`;
CREATE TABLE `snsii_product_cache_copy1` (
  `ProId` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Json` longtext COMMENT '内容',
  PRIMARY KEY (`ProId`)
) ENGINE=MyISAM AUTO_INCREMENT=10093685 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_category`;
CREATE TABLE `snsii_product_category` (
  `id` int(6) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` char(100) NOT NULL COMMENT '分类名称',
  `EName` char(100) DEFAULT NULL COMMENT '自定义名称',
  `Links` char(100) NOT NULL COMMENT '分类链接',
  `Number` int(6) NOT NULL COMMENT '产品数量',
  `Pid` int(4) NOT NULL COMMENT '上级分类',
  `Sort` int(5) NOT NULL COMMENT '排序',
  `Md5` char(32) DEFAULT NULL COMMENT 'MD5',
  `PriceSwitch` tinyint(1) NOT NULL DEFAULT '1' COMMENT '价格开关',
  `PriceRatio` decimal(10,2) NOT NULL DEFAULT '1.00' COMMENT '价格比例',
  `Image` varchar(100) DEFAULT NULL COMMENT '分类图片',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Links` (`Links`),
  KEY `Sort` (`Sort`),
  KEY `PriceSwitch` (`PriceSwitch`)
) ENGINE=MyISAM AUTO_INCREMENT=1055 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_hot`;
CREATE TABLE `snsii_product_hot` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `ProId` int(8) NOT NULL COMMENT 'ProId',
  `PartNumber` varchar(100) NOT NULL COMMENT '型号',
  `Quantity` int(8) NOT NULL COMMENT '数量',
  `UnitPrice` decimal(10,5) NOT NULL COMMENT '单价',
  `Description` varchar(200) NOT NULL COMMENT '描述',
  `AddDate` datetime NOT NULL COMMENT '日期',
  PRIMARY KEY (`id`),
  KEY `ProId` (`ProId`),
  KEY `AddDate` (`AddDate`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_search`;
CREATE TABLE `snsii_product_search` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `PartNumber` varchar(50) NOT NULL COMMENT '型号',
  `BigCat` smallint(2) NOT NULL COMMENT '大类',
  `SmallCat` smallint(3) NOT NULL COMMENT '小类',
  `Mid` int(5) NOT NULL COMMENT '商家ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `PartNumber` (`PartNumber`),
  KEY `BigCat` (`BigCat`),
  KEY `SmallCat` (`SmallCat`),
  KEY `Mid` (`Mid`)
) ENGINE=MyISAM AUTO_INCREMENT=10093686 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_so`;
CREATE TABLE `snsii_product_so` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `SmallCat` smallint(3) NOT NULL COMMENT '小类',
  PRIMARY KEY (`id`),
  KEY `SmallCat` (`SmallCat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_stock`;
CREATE TABLE `snsii_product_stock` (
  `ProId` int(8) NOT NULL AUTO_INCREMENT COMMENT '产品ID',
  `StockText` text COMMENT '库存备注',
  `AddDate` datetime NOT NULL COMMENT '添加时间',
  PRIMARY KEY (`ProId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_time`;
CREATE TABLE `snsii_product_time` (
  `Id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Year` varchar(4) NOT NULL COMMENT '年',
  `Month` varchar(2) NOT NULL COMMENT '月',
  `Day` varchar(2) NOT NULL COMMENT '日',
  `Date` date NOT NULL COMMENT '日期',
  PRIMARY KEY (`Id`),
  UNIQUE KEY `date` (`Date`) USING BTREE,
  KEY `year` (`Year`),
  KEY `month` (`Month`),
  KEY `day` (`Day`)
) ENGINE=MyISAM AUTO_INCREMENT=52 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_time_list`;
CREATE TABLE `snsii_product_time_list` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `PartUrl` varchar(50) NOT NULL COMMENT '型号链接',
  `PartNumber` varchar(50) NOT NULL COMMENT '型号',
  `AddTime` int(10) NOT NULL COMMENT '发布日期',
  PRIMARY KEY (`id`),
  UNIQUE KEY `PartUrl` (`PartUrl`) USING BTREE,
  KEY `AddTime` (`AddTime`),
  KEY `PartNumber` (`PartNumber`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=52003 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_product_time_temp`;
CREATE TABLE `snsii_product_time_temp` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `PartUrl` varchar(50) NOT NULL COMMENT '型号',
  `BigCat` smallint(6) NOT NULL COMMENT '大类',
  `SmallCat` smallint(6) NOT NULL COMMENT '小类',
  `Mid` smallint(5) NOT NULL COMMENT '商家ID',
  `Status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `PartUrl` (`PartUrl`),
  KEY `BigCat` (`BigCat`),
  KEY `SmallCat` (`SmallCat`),
  KEY `Mid` (`Mid`),
  KEY `Status` (`Status`)
) ENGINE=MyISAM AUTO_INCREMENT=3636429 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_supplier`;
CREATE TABLE `snsii_supplier` (
  `id` int(5) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `Name` char(100) NOT NULL COMMENT '名称',
  `Keywords` varchar(100) DEFAULT NULL COMMENT '关键词',
  `Description` varchar(200) DEFAULT NULL COMMENT '描述',
  `Content` text COMMENT '简介',
  `Links` char(50) NOT NULL COMMENT '链接',
  `ProNum` int(6) DEFAULT NULL COMMENT '产品数量',
  `Web` varchar(200) DEFAULT NULL COMMENT '网站',
  `Status` tinyint(1) DEFAULT '0' COMMENT '状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Links` (`Links`)
) ENGINE=MyISAM AUTO_INCREMENT=1428 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `snsii_track_order`;
CREATE TABLE `snsii_track_order` (
  `id` int(11) NOT NULL COMMENT 'ID',
  `Email` varchar(100) NOT NULL COMMENT '邮箱',
  `Number` varchar(20) NOT NULL COMMENT '订单号',
  `Content` longtext NOT NULL COMMENT '进度详细',
  `ProList` longtext NOT NULL COMMENT '产品列表',
  `Status` tinyint(1) NOT NULL COMMENT '状态',
  `AddTime` int(10) NOT NULL COMMENT '添加时间',
  KEY `Email` (`Email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ---------- 恢复会话设置 ----------
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
-- 结构导出结束
