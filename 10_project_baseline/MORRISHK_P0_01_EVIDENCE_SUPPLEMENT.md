# Morrishk P0-01 证据补充材料（Codeup 应用代码独立验收）

- 对应任务：P0-01
- 对应报告：`10_project_baseline/MORRISHK_P0_01_REPOSITORY_AND_DEPLOYMENT_BASELINE.md`（未修改）
- 应用仓库：`https://codeup.aliyun.com/5f0af04d5fd102f22f6b747c/morrishk-site.git`
- 被验证提交：`1d66acb3a5c9d004939c60f15aa2d4d392513575`
- 当前 `main`：`cdb9c044dd2f2fc86967dc6738341b11bbeba7f5`
- 采集时间：2026-11-17 22:22–22:30（Asia/Shanghai）
- 采集方式：对本地克隆执行只读 Git 命令与文件读取；**未修改代码、未新增 Codeup 提交、未推送、未连接服务器或数据库**

---

## 0. 证据说明与脱敏规则

1. 本材料中的 diff 来自“来源目录 → `1d66acb` 提交内容”的逐文件比较。
2. 为防止在评审仓库再次复制凭据，所有密码、密钥、Cookie 密钥、Zone ID 以及账号标识在 diff 中以 `<REDACTED_*>` 替代；替代仅发生在展示文本中，不改变差异结构。
3. 每个被改动文件同时提供来源文件与 Git blob 的 SHA-256、字节数，Reviewer 可在获得原始来源后自行还原校验。
4. 未修改原 P0-01 报告；本文件为单独提交。
5. 所有扫描只针对 Git 已跟踪内容（`1d66acb` / 当前 HEAD），未扫描来源目录中的未跟踪文件。

---

## 1. 提交对象与父提交关系

### 1.1 `git cat-file -p 1d66acb3a5c9d004939c60f15aa2d4d392513575`

```text
tree f3acd46f2ba057c9f6f25aa0e59b9fdeb3ed9119
author esan <esan.wu@gmail.com> 1794924259 +0800
committer esan <esan.wu@gmail.com> 1794924259 +0800

chore: establish Morrishk application baseline

- 归集现有 Yii2 应用代码（config/controllers/models/views/modules/commands/service/snsii/messages/web 等）
- 排除生产上传文件、抓取数据、生成型 robots 副本、翻译备份压缩包与临时文件
- 凭据改为环境变量注入，新增 .env.example / .gitignore / README / 架构、部署、数据库说明
```

### 1.2 父提交

```text
$ git rev-list --parents -n 1 1d66acb3a5c9d004939c60f15aa2d4d392513575
1d66acb3a5c9d004939c60f15aa2d4d392513575
```

输出中只有自身 SHA、没有第二个 SHA，说明 `1d66acb` 是**根提交（无父提交）**，不存在被隐藏或改写的历史。

### 1.3 关键字段

| 字段 | 值 |
|---|---|
| 对象类型 | `commit` |
| tree SHA | `f3acd46f2ba057c9f6f25aa0e59b9fdeb3ed9119` |
| 父提交 | 无（root commit） |
| author time | 1794924259 → 2026-11-17 22:04:19 +0800 |
| committer time | 1794924259 → 2026-11-17 22:04:19 +0800 |
| 提交信息 | `chore: establish Morrishk application baseline`（含 3 行正文） |

---

## 2. 基线提交的完整文件清单

以下为 `git ls-tree -r -l 1d66acb3a5c9d004939c60f15aa2d4d392513575` 的原始输出（制表符分隔：mode、type、blob SHA、blob 字节数、路径）。

- 文件数：**620**
- blob 字节数合计：**21,341,867**
- 与 P0-01 报告中“21,352,168 字节”的差异说明：报告中的数字来自工作区 `du`（受 `core.autocrlf` 检出时 CRLF 展开影响），本材料采用 Git blob 原始字节数，二者内容一致、仅行尾表示不同。
- 最大文件：`web/css/style.min.css`，330,339 字节；无文件 ≥ 1 MiB。

```text
100644 blob a39b5b0fbccb08bf73f9020ac2ce4e5cde33839b      43	.bowerrc
100644 blob 6dfe452133859fd2aab83a0eb2e357a418d1a554     241	.editorconfig
100644 blob b8f31e0e5d1743646cda7f7a35cb995cc27391f4     511	.env.example
100644 blob 4a8c700bc54898f352b888eea04c09a9c2aa5343     696	.gitignore
100644 blob 0519ecba6ea913e21689ec692e81e9e4973fbf73       1	.htaccess
100644 blob 6f17eaf5da06745d954aa7a99a5b9adff10cfe92     138	404.html
100644 blob ee872b9abf3ea7df75f3a9a2436524d6052bb9cf    1524	LICENSE.md
100644 blob f77aebb3a6b6274cda74616ae4569bcdd7c9e9b5    4562	README.md
100644 blob 258aea601aa07b84473f7cb2fde9acb2d03f9cc8    3003	Vagrantfile
100644 blob 4b7b9a7fcf179e4c45d98d607ab2dc13fda356e9     658	assets/AppAsset.php
100644 blob c8c21690d74cc664565c4870b9916f9b73f03fe4     571	codeception.yml
100644 blob 79ec93feb3434fa8aa64caf45cbc4fab8244c96b    1409	commands/AdminAsset.php
100644 blob d8df00d6854d43eb4eb67194fa0f197b97cddab0    3241	commands/AdminController.php
100644 blob 2c02c823954554cc5c0395fe990ed40c526eade5   13438	commands/CController.php
100644 blob 5cc59c0b1635f58842648d0d928dfb859f1b0cea    9071	commands/CControllerBF.php
100644 blob 00fb856730cad3b7aeba979b7fe0e77a093e4592    3385	commands/CartController.php
100644 blob 27addb46ba2db444e80505e996a6c3a356861a12    2076	commands/CatController.php
100644 blob 5972484f8b3be51d71c213fd4857de7846998871    9872	commands/MapController.php
100644 blob 6dd8f02e09f389dcac4cb064a4759adcd03ebf7a    1478	commands/NewsController.php
100644 blob f1d9ba35fb77e2fc4027c4f986645f5540cb0c7b    8486	commands/ProController.php
100644 blob cc68ac25ae1119f8d60e5fa04f6f4993c2cf834f    3573	commands/SnSiiController.php
100644 blob 99dce1b3d9c2207f88bf18fe25fcdab8d5f142d5    1391	commands/SupplierController.php
100644 blob 5ca2e2b7f4f8f9ed6b351f274ff94bc4c6c89983    2800	composer.json
100644 blob 4b7038df5746eaab8e3fd50bb3124faa0c4921d0  310134	composer.lock
100644 blob 33ee01e3dd87724afe9c93e56954d4608ce7bdf6    2589	config/console.php
100644 blob bfdf1348670da2bfc6b5d8a0fd43054c0b1c0c6c     457	config/db.php
100644 blob 5bc5fa9bb800fd3f24e48ac46bdf2fd95e7b1379    1479	config/i18n.php
100644 blob 94ee0646cd733fc31295fec80d9be0b5b912051c    8154	config/params.php
100644 blob 8d6cf975ed5e7831e1a729a191e492555236b221    6585	config/web.php
100644 blob 4818425f18a3117ca385667da2b9a7eefccab306    4644	controllers/BlogController.php
100644 blob 74cc1ef2853a79576d029d2a2408dffc0fecb1ed   10095	controllers/CartController.php
100644 blob c07f0daea0a6b34d98564001c8b1ece5c05b443c    2434	controllers/LangController.php
100644 blob 17c9efe9befa890f14596e5d9ded46a2a74bde58    3199	controllers/MfrController.php
100644 blob 7d62065a8f3cdc91398117099da138187a83c399   12079	controllers/PageController.php
100644 blob 358fdbc807fda9cc28272ce9886394a29397ce84    2327	controllers/PageController_bak0609.php
100644 blob adba299e3cf876d9af56cec006fc2ddee5703e0f   17692	controllers/ProController.php
100644 blob adba299e3cf876d9af56cec006fc2ddee5703e0f   17692	controllers/ProController_bak.php
100644 blob 2452afd536c4cbe269a81ef8f450cb0db0d3f8d9    3027	controllers/SearchController.php
100644 blob f56480770f0f2141a3342b6102d54156cfa1d6e8    8734	controllers/SiteController.php
100644 blob 86be3bd0d7903e0e3b397a66bc55880623465710     206	docker-compose.yml
100644 blob 278e4d9461bb8e0e57190e6bdb8eea9868a44507    2813	docs/architecture/README.md
100644 blob a8ab7cdb5ad1cd170c76939958dd23a15dab73ba    1601	docs/database/README.md
100644 blob b3f84f8fb7045021c4cb87805378b7f8ebcb2801    2251	docs/deployment/README.md
100644 blob 789b80794430f8626fa4990fc9d22af54b1f1750    1120	domain.txt
100644 blob 12861902fd2c594bccf0b34fdac487a53e83ea0e    2228	mail/Contact.php
100644 blob d4df7f32fdf545743756984f4b38093ab2f89b93    6043	mail/QuickOrder.php
100644 blob bddbc61290279dfb0fee161c13c1fe2c6a052b6a     714	mail/layouts/html.php
100644 blob cb0939fad41fa13ccfb505e41a3e7ae309804227  108799	messages/af/attr.php
100644 blob 316116e4ac51443038f792fa7b09b98ae70b4881   69702	messages/af/cat.php
100644 blob 46184e67a8d873a7f01975fbe545695daaf7328c   12591	messages/af/info.php
100644 blob a937a9781f00d7cf5c8bac4ba92e85a111a7ca80    8094	messages/af/main.php
100644 blob 29351b23e432c7ad7db6af97d3cb580b9b2ca185    1843	messages/af/seo.php
100644 blob a67fc652d5a5fea10f8036c7b56015e0e33e7aec  130959	messages/am/attr.php
100644 blob 5dbdb71430094434e92086877968d00d49f85cf2   89139	messages/am/cat.php
100644 blob c3131168da24e84ad7a12ef4990c9fa6e22064e8   17371	messages/am/info.php
100644 blob 4ca1e4a87237006d79fa71e5ef8922ba3f0296f1   10032	messages/am/main.php
100644 blob 80c24782917f69151cb5aef391220548557b386b    2417	messages/am/seo.php
100644 blob ca88486fdc0a92a548aa911922aab3810a734356  127337	messages/ar/attr.php
100644 blob a5867e56f8ec53f002df5235fa260b238de1e9bf   88121	messages/ar/cat.php
100644 blob 583cfe2d9ac4035b040a8faf919d5710565d65d8   16481	messages/ar/info.php
100644 blob 74fc8aafe1a32926b1fa361413b3248758ffb462    9913	messages/ar/main.php
100644 blob f57463c34c42e62da888edebac85f4f3feff27c3    2372	messages/ar/seo.php
100644 blob 8887d36dc85038ee68caf8f8f97c72e4e5854b9d  113921	messages/az/attr.php
100644 blob e3b83658875729cbbbb1c2b5c345dd5089968f9c   75596	messages/az/cat.php
100644 blob 2f56034a9cf8e95b203aa14599820f3982467e46   14000	messages/az/info.php
100644 blob ca295065010af15e6e792dc98375539395302775    8807	messages/az/main.php
100644 blob 1a7d6940ccb263b3f1761986a768dfa11b184e75    2027	messages/az/seo.php
100644 blob eb0aec58cb45b203d0cf22bc447f4f02ea3fefac  139737	messages/be/attr.php
100644 blob 95827784f7afdcf8b88de03ce6048a5cdd41c716   95577	messages/be/cat.php
100644 blob ceea5b0d15ea19aedd37d18ef14bfcce1570b3c0   20617	messages/be/info.php
100644 blob b57d066efc12df2f2475679560e0690d62be1e30   11082	messages/be/main.php
100644 blob ecdd9e3bac4806d3798348064d192d2766f42f2d    2597	messages/be/seo.php
100644 blob 1b82dcfffb06e6d9681e4959b5f43e87809c4ccf  141109	messages/bg/attr.php
100644 blob b1f0393c744aa5e047f13810746227aa46098088   94962	messages/bg/cat.php
100644 blob 558eeee0cb88a03d1230eb3427a3ef833c122895   21069	messages/bg/info.php
100644 blob f706b4b88f3a5f1fe5f452ac46999fa7422ec468   11244	messages/bg/main.php
100644 blob 8de2ecdbd79f49af5696e5c4ec39729974a29658    2677	messages/bg/seo.php
100644 blob 799660c37220464a250f7dfe439fc35072c42395  156729	messages/bn/attr.php
100644 blob 0d2aeac69e425f8a727da56fcf26258ad4bf0e17  107977	messages/bn/cat.php
100644 blob fc1e265a7ba02fb5fa16d9b4f1cf40fb0441c40c   25401	messages/bn/info.php
100644 blob 26358631f0d58f8012a16ab5376cedc14a43525c   13351	messages/bn/main.php
100644 blob 232589f08325d36596e3fe0bb721cfa8d02433b4    3077	messages/bn/seo.php
100644 blob 80522c4c25e5ea4c436fa86046239d97f8658059  110379	messages/bs/attr.php
100644 blob b78142745756945ee29494e70c83a8c0c2bd7191   70760	messages/bs/cat.php
100644 blob 9c6bb9cc32d7858095b861a643c131dc3e890fd5   12354	messages/bs/info.php
100644 blob 0284925fe6c7673909f518383d93037d2da1b16d    8129	messages/bs/main.php
100644 blob e4996cf5578ebf270995bb8d8c3fa8d353a0626b    1881	messages/bs/seo.php
100644 blob dc3675844c736d5f5598f0c206f04031b7988cc3  114904	messages/ca/attr.php
100644 blob 15a3a1e9a23eb66e85067ffee9a5d7f9756bd1c1   73503	messages/ca/cat.php
100644 blob 311a329d9e5c5fec9f5eab3d1150eb66f51878a3   13417	messages/ca/info.php
100644 blob e1738efce57070ef45656fd059c2340fd2829130    8656	messages/ca/main.php
100644 blob 895f2b3f142b15810f1a5689b910aeac028bc5bf    1957	messages/ca/seo.php
100644 blob 4fb3163f79787b9e8809fbf1ed201e6cdb3582ad  114076	messages/co/attr.php
100644 blob 0f9ac74ce9b34598ac556db23f8a9586f50e88a3   71355	messages/co/cat.php
100644 blob df87b91a866192e82823927d95dacf17b7c2f5a8   13228	messages/co/info.php
100644 blob d6d65f51d3d65c68791566db7de442bef2fc4251    8263	messages/co/main.php
100644 blob 369af37f4beecceeaf264a8064dd07c49251c569    1891	messages/co/seo.php
100644 blob 20f2052ee7b566b06dbe2e38c5a1899af421fdc0  111894	messages/cs/attr.php
100644 blob 03e59991d04291306ba699ae39e06a039ceeff07   72318	messages/cs/cat.php
100644 blob 113f2b599688a635695a0b908a7bc6e62aec9ad7   13008	messages/cs/info.php
100644 blob fa81762ca81e990b5cc98226e720f391e071df69    8400	messages/cs/main.php
100644 blob e206a41b865bfe69abd6bad3b84e5ed8be54eb4a    1938	messages/cs/seo.php
100644 blob efa7ea17e895166d77432c89e1c8d905fce63ec9  108940	messages/da/attr.php
100644 blob 62ef1b1ef8d635085223e65f627aa90401c3e666   68566	messages/da/cat.php
100644 blob dd338ba1f2b1b110f63652ba056704c0007213f5   12570	messages/da/info.php
100644 blob 96cb3e4e6ccdf35ccc1e8c505b2cb9790e416225    7989	messages/da/main.php
100644 blob 85d22421582315bc994b97ada1ede477c87f4837    1846	messages/da/seo.php
100644 blob 4c29d071acd77d72ec37a6d3d36e4b8b2a763c9c  110283	messages/de/attr.php
100644 blob 5ae7843bb0e79985d0407e6d9d06f2a7de9141dd   70030	messages/de/cat.php
100644 blob cd739b3da19b2bec1d4bca5217b78ab058f1909f   13230	messages/de/info.php
100644 blob 51bf08d6debf7a564da79a70cd3c834975e4ba8a    8542	messages/de/main.php
100644 blob 34eab3bed2f8835ebb8436e25664a7689dba1c9b    1975	messages/de/seo.php
100644 blob 0f0dadea6f9790f7114e92e33f54842d5c648894  139592	messages/el/attr.php
100644 blob 6cacf3bf7ea255c6476107f170d4cd98e3e5c087   94223	messages/el/cat.php
100644 blob 5b4a80a610f122e311ddbfc1565f442370a1bbbe   21992	messages/el/info.php
100644 blob 494a9484493109dad9fa225d01125d3150d7ca65   11267	messages/el/main.php
100644 blob 03c4904effc07e182ce1e5579f0747c2016166c4    2723	messages/el/seo.php
100644 blob 3503104d9bfca0b7425eeb2f54e5f82bd7f4c7ee  107809	messages/en/attr.php
100644 blob 6334e1be33dd7924f0c98d27be30d243617ab744   68741	messages/en/cat.php
100644 blob 24aeda5c552bb369668f5b19056e03af73a764a7   11698	messages/en/info.php
100644 blob 73656e7fc57d436feab67ca69d95f8983e994522    7839	messages/en/main.php
100644 blob 8bd67bec700b99846ee9a59dc00c5fa4b5f324aa    2453	messages/en/seo.php
100644 blob aeb8211cc71fc872dcca2f42683d1a1da2941cba  115755	messages/es/attr.php
100644 blob bd8518c8fc9d1e130c0b04ab3c176dd84880e7c6   74643	messages/es/cat.php
100644 blob 03036c86082ff98fe528092e1c4489a3cd4c8b7f   13190	messages/es/info.php
100644 blob 818c7aff360768eb772092fb4bc408d267387b10    8662	messages/es/main.php
100644 blob cee726779506fea65bf8f27a0cb68f69dbbff0ae    1961	messages/es/seo.php
100644 blob dcc51b250827de98162ab1e23fb1b3365a3277d4  110007	messages/et/attr.php
100644 blob bf76f3b099858c0caef3899e98d1e0fea7c76e1b   70655	messages/et/cat.php
100644 blob 112eebd8ec0bf6a54647fdb56f983a180984b22b   11856	messages/et/info.php
100644 blob a17865f457ffb9dbfe7a55ce77d098620aaf8d1f    8090	messages/et/main.php
100644 blob ed7e2f9e0faa9ebe2d02f9154b835417a7917d3b    1810	messages/et/seo.php
100644 blob b487925bc42ab15535c817da9a70df8b4553b169  113473	messages/eu/attr.php
100644 blob 5f50d56f30f99ce9e3cba259c22b93f62f915dd3   73168	messages/eu/cat.php
100644 blob a368ad41fed12ae3e7e255e8873ec32402a5ae9d   12625	messages/eu/info.php
100644 blob 6e50503c937a3e6eef0fcb9e877bcecf0d075ad4    8514	messages/eu/main.php
100644 blob b0d6744d9ce33d7b8aca121e1ed008055ee789ae    1843	messages/eu/seo.php
100644 blob 663463a7c5a6d00699102d3c282c8f3c279e48b2  122388	messages/fa/attr.php
100644 blob 3ace9f319d5aafdcd43efd71cf35de677604d895   85106	messages/fa/cat.php
100644 blob 97421fd4ea8f9360ff11499e3f7088cb5dac50d4   17396	messages/fa/info.php
100644 blob de0ccc24e52c6e82c947cb1a3b2435e3f651924f   10289	messages/fa/main.php
100644 blob 8178c410cc979b53ffe3f87e427937a328baa9d3    2359	messages/fa/seo.php
100644 blob 440dcf7752094aed3d87f861804edbb2d643b4e3  110694	messages/fi/attr.php
100644 blob 60b68cd60c60cb8f6a98017edf0ecf5ebcb2b273   70800	messages/fi/cat.php
100644 blob dc8f026f2b0993a2fbe8105bdbfe18922390a3e8   12789	messages/fi/info.php
100644 blob b3c3395846bb1f46fa5856f88894dc140fa23aa7    8163	messages/fi/main.php
100644 blob 8c88599865790e9b43ca3d3ceb7c8eb309184e26    1831	messages/fi/seo.php
100644 blob 70f2f85fff0ac28ca0e97774a50e110f0f8e5ece  115411	messages/fr/attr.php
100644 blob 11e640b7f0c6eeb4bac2768da27baef8d9e5570a   73776	messages/fr/cat.php
100644 blob 36c68f92e7499274311042e9084af7cd3adbd4c8   13618	messages/fr/info.php
100644 blob f26ac4365d595e4a4824a7613489e4a3c4cf8602    8678	messages/fr/main.php
100644 blob 89d865c622d507a50e219075b874dfd669dbae50    1973	messages/fr/seo.php
100644 blob 1446fe3b93db9411884e939ab1927fdf1d84a3a9  112419	messages/ga/attr.php
100644 blob 7aa6569fe7d7b9f3f9844ff35f42b45ee259db67   73660	messages/ga/cat.php
100644 blob b3425693e5466565aa53bfa154ecedcfde0bf881   13164	messages/ga/info.php
100644 blob 2a094db47f83403fec20212011aff4434130e8b4    8640	messages/ga/main.php
100644 blob fca91a08986fab48409c199aae029b84867232b0    1934	messages/ga/seo.php
100644 blob 6eb2afa0fa7e3d27f87b74d21787b16b0d1540f8  114951	messages/gl/attr.php
100644 blob 8593ff9e29cacc4c5e85485aac1f627c60bac414   73980	messages/gl/cat.php
100644 blob ce9620510eaf1fe896d2de6387cdfebe6814c682   13017	messages/gl/info.php
100644 blob b0a8fe43116f9db0f94455f091c2f810b0704c6f    8520	messages/gl/main.php
100644 blob 1eb2892eb287e7b202e1f6a3d07b200029d49a1d    1963	messages/gl/seo.php
100644 blob 4807084e27c4ac82ce1c0a74dcc0f6ca06ca03f1  152081	messages/gu/attr.php
100644 blob bce831ecd5fb7051730dd761402e6a9cf55701d7  106941	messages/gu/cat.php
100644 blob 2a2c4dcf2340aed7cfec16fc4494032a590fa643   25841	messages/gu/info.php
100644 blob 41cec60e6a8e50630744a0fd8927bc229c835ceb   12707	messages/gu/main.php
100644 blob 69fd513be2e7f757f9f7a29af0d4451638e38a6a    2928	messages/gu/seo.php
100644 blob 6783128bd98f509b1700a05c5a6ac9bfd94d6a78  109487	messages/ha/attr.php
100644 blob 70b0a38a7a14b3f9b48b2ef0413970b2a55b8437   70626	messages/ha/cat.php
100644 blob 951dbfd7657dfbc34e5cc9bf9ba3c8bcfdb4c82b   12867	messages/ha/info.php
100644 blob 6e2ad321f8f2afd1e414f8e23935dde939fb508d    8092	messages/ha/main.php
100644 blob f6f03c2ecdf5662e26eb3540d7e04ca2ea0d532b    1765	messages/ha/seo.php
100644 blob 2f8aeeab870a8004fc77e8efdbf5daff4c4e78ea  153661	messages/hi/attr.php
100644 blob cddbe5d4c74d296eae34b14ee98e112c2581ee89  105312	messages/hi/cat.php
100644 blob 4887d60ea35f96d83590ed30ad86f0e2a3c3bef5   26736	messages/hi/info.php
100644 blob 4239d6acbcbbdcdcff3d6bfd90414b8d7cfc865f   12986	messages/hi/main.php
100644 blob 3a9076dbbc249c0333e8bc1b1603ad209ab9d828    3011	messages/hi/seo.php
100644 blob eb9a0be86b78fc3d5a1963cc0e67f1be4959a79e  110715	messages/hr/attr.php
100644 blob cc0444ba26ebe9ec36890edceb76a64634b9e0ee   71035	messages/hr/cat.php
100644 blob 2dea4838917b5dcf281cff2e9faf5abface4e93a   12380	messages/hr/info.php
100644 blob 8877db6f39f7581ab52da20ee68b79a2f5d1765a    8108	messages/hr/main.php
100644 blob ebeb92db794409b293a6f8b598d4668ecd547832    1925	messages/hr/seo.php
100644 blob 8882535729c1c362e159454d44d15784f04ea442  108042	messages/ht/attr.php
100644 blob a9f573b4d966a867a719a5fa6911dbb04f7222e4   68126	messages/ht/cat.php
100644 blob a6823831f511582e481f79ccb5448a704ece1956   11557	messages/ht/info.php
100644 blob 6d92c4785bc1ee1bb533d5c0b6b68c64af5b9cec    7841	messages/ht/main.php
100644 blob cea4be4102e7432a73cd873398805232b60d1fcd    1762	messages/ht/seo.php
100644 blob 4c622f4ead42164dbeb38893b6d72e6eda16c52e  114111	messages/hu/attr.php
100644 blob 5231e365b5463f7edd27bd2630e2d015e9766bd1   73142	messages/hu/cat.php
100644 blob 83dc8b6aae52b75fda7bb1a535bd87d7a502e0dd   13856	messages/hu/info.php
100644 blob 81e350320aa3256cb66b80530171cfadcaff950c    8551	messages/hu/main.php
100644 blob 5ba065478a1ccc5f8116ad1ec3e2c89bbd26428c    1934	messages/hu/seo.php
100644 blob 292c48458c970b0ec3396e2eb3986e24a2032228  109303	messages/id/attr.php
100644 blob 1e2b5ccb7ee93ae32857f1996e64f471d66e72f4   68081	messages/id/cat.php
100644 blob 7856381d7e24e590d6e3b883dc010d2be7363c5d   12593	messages/id/info.php
100644 blob e2bed74cbd02992d2d0ed9b46218ccdb836d642d    8324	messages/id/main.php
100644 blob e624fc2383b4e777b82774768c3c5124728eeaaa    1802	messages/id/seo.php
100644 blob 0e1429b2489e977ff5fbefb219045fd9e79aefc0  108798	messages/is/attr.php
100644 blob 2d4447315fe1695551594c2c37ed9cb7c3f47eab   68366	messages/is/cat.php
100644 blob ef7c8009c3f79841f08dd11a671bde1ed51ab347   12884	messages/is/info.php
100644 blob 989a9f69cb68213da83158343d8e1dc402e5de6b    8468	messages/is/main.php
100644 blob caf1d0e93be6f29abd5079c638b726613d60985a    1800	messages/is/seo.php
100644 blob 4e247ed0f56b453bbc43062fb88b0c2ad714a586  115656	messages/it/attr.php
100644 blob fe9a420ff3d5decb1a4381c7e2d08f6243dfa9fe   72215	messages/it/cat.php
100644 blob 3931341bbfe7a229d36f7c738aac85ccbab54d73   13410	messages/it/info.php
100644 blob edea84f7ce9fc275e09715cf1c51f1768abb71bf    8385	messages/it/main.php
100644 blob 284a0dd98044427e6761066c3b3a97d1906615e3    1920	messages/it/seo.php
100644 blob 0df4d25a82cfdd5eff678f02bf6925b33eda6dfc  118629	messages/iw/attr.php
100644 blob 863d05021ddc89578997ea4870bac0e0d349ac0f   79459	messages/iw/cat.php
100644 blob d40f229bf5aa91ace160942b61f260a11782d15c   15040	messages/iw/info.php
100644 blob 5bad839abac9217c4981085a415127c5b3a2793f    9252	messages/iw/main.php
100644 blob 72df093c3a58daf5f947a793b5c6e5c185fcd1f7    2194	messages/iw/seo.php
100644 blob 47e6f289dca509f9b049dadd9ebd5ebbb1b93940  114000	messages/ja/attr.php
100644 blob ce37b1e9f741c382526c089669c542a896c799c5   78445	messages/ja/cat.php
100644 blob 0a2cfde9802ac0f260763065ad032be96f938cee   14147	messages/ja/info.php
100644 blob 6c84a9067f0bfa8dd26789a7b7e61133a2b7feae    9062	messages/ja/main.php
100644 blob 7008e0f36d8249eefdbbd922f336db54aa8b681a    1899	messages/ja/seo.php
100644 blob 3b6605cfa9fa8142330a4c6aa1dc4ea9777bc582     649	messages/ka/attr.php
100644 blob a120ccdd4ae081c29991ccec36dae2f7f64a4f99  123545	messages/ka/cat.php
100644 blob 1c938b5da1891ada7e441ca9c181efeebb8949d3   29552	messages/ka/info.php
100644 blob e1e079598ebf8f68940325caa1a1a98f71ff7cd8   14265	messages/ka/main.php
100644 blob 2358c30fcd1c31ae7ab55ed56c8511ab2f998a96    3537	messages/ka/seo.php
100644 blob 8c22c651126fe8270c484bc5f29cfa029ecd2782  136757	messages/kk/attr.php
100644 blob b4f71e38bf9251ef6793be869ac5901ceba6b735   98968	messages/kk/cat.php
100644 blob d71e632fd62a753df32cd5d248a920f75d00bde7   20629	messages/kk/info.php
100644 blob e0ce4ad023bd587d59ca32261ce2822f9a508525   11047	messages/kk/main.php
100644 blob ea125b98a7624b9f4ce74444a948f1c785c31eae    2608	messages/kk/seo.php
100644 blob c7254ff0ced3072b7f729af73bc320b8ca3f71e4  159122	messages/km/attr.php
100644 blob 85222e35cb0f3ea491c265a5f303317c5441db76  109214	messages/km/cat.php
100644 blob 41ed0b5febc3cc7675d77f9bb973fe008320aaa2   28764	messages/km/info.php
100644 blob 9d4b73c3fa9aa577406fdfc8ea5126a58806d2b7   13570	messages/km/main.php
100644 blob b2bf4d254227deb6528eb9e75542166a3032a868    3414	messages/km/seo.php
100644 blob e0d103efdb031c1bebbf3de8aded28d8ef7a4806  158642	messages/kn/attr.php
100644 blob 1eb1061de19ece80de88c5ff8020a1cbf1ec5744  121279	messages/kn/cat.php
100644 blob 4abf0bffe241c058d7545b87759324d17153017d   27655	messages/kn/info.php
100644 blob 6af5283cc7ebf8db967225d13b7cd0cc388b589b   13946	messages/kn/main.php
100644 blob c22dfc890408ed3140192c37e411f496cdfb93b4    2834	messages/kn/seo.php
100644 blob fd07a569e333c76410f9c9120eba4a617a4f04c0  108537	messages/ko/attr.php
100644 blob 86b62b6ac03c8f440671ec535df6a23a80877ff0   70703	messages/ko/cat.php
100644 blob b33ecf5ff7d085e55d494566e1de0858d25c8c23   12477	messages/ko/info.php
100644 blob bdb2292468c8c977d18852ebb4a11d30a2995521    8545	messages/ko/main.php
100644 blob dde65112acf2e7fcb5f9ca7d4b8bbd8a16bcdce9    1813	messages/ko/seo.php
100644 blob 6ebe3e9b06e41e12f244ac0ecb0055ca3c804c33  111477	messages/ku/attr.php
100644 blob 6047b41f25c443a77076734080d8eac94593b954   70791	messages/ku/cat.php
100644 blob 04fc4ce2c0dfc0bb7123d619dbd89d525d52e3e3   12891	messages/ku/info.php
100644 blob 0931a361e2af7dfd068b971810637de250c02636    8528	messages/ku/main.php
100644 blob ad23073684a8c63b0668f37249c6389d4526cb6c    1912	messages/ku/seo.php
100644 blob 5f3d221aac550fc5917c3d0212b14878526bcdfd  138104	messages/ky/attr.php
100644 blob c208e8fdc232ab4e34186d73144344d42b203487   98801	messages/ky/cat.php
100644 blob 978a2db033635bb6aa4d39ea958400be00946c67   20026	messages/ky/info.php
100644 blob 446a7621bd60c73f06622307bcb922d6b3e36988   11197	messages/ky/main.php
100644 blob f3c74d01e3d05085556d41184bb7bc6e006a761e    2747	messages/ky/seo.php
100644 blob 584b77404d916d04f4887f8d559d66b67c75aab9  110425	messages/lb/attr.php
100644 blob e9a12b82c88d0a8d11e4e107ee539513ed39256d   70055	messages/lb/cat.php
100644 blob f20c9e8a243758e37e1b6f0a812b5f3251def452   12630	messages/lb/info.php
100644 blob 03ea2c0f020ce979796d22734a5e30fd1466360d    8253	messages/lb/main.php
100644 blob 78ffb09d45e4244c438208c536df73b2e80ce95f    1886	messages/lb/seo.php
100644 blob 076e08c70ae45dd197251791184560ead64d397c  154800	messages/lo/attr.php
100644 blob 0b5afb154c9d6a4f4d19663510c3fb2bf949acc1   95311	messages/lo/cat.php
100644 blob c3777e2dabe24f51164cf1f5c4812187829ae373   27864	messages/lo/info.php
100644 blob ed1585a6715984d916601681d7834279319d2af8   13303	messages/lo/main.php
100644 blob cd6704ec6b7e2d02c96b0c03a9b4717f34cab6b3    3204	messages/lo/seo.php
100644 blob ce2addddda8cc69c6ac271de23fa0003784e8339  114528	messages/lt/attr.php
100644 blob bb94523416dc1d6915fb2ae1794974dfee33657d   74159	messages/lt/cat.php
100644 blob b138097833a198bc010341cc3982e2f73bc415d6   13020	messages/lt/info.php
100644 blob b1f74055c887d537c23f61174d4afec6f8dea866    8482	messages/lt/main.php
100644 blob b028845b7a91320af2acba5a05c994cbee2909e1    1932	messages/lt/seo.php
100644 blob a2f0daabfbecf630014ee167d4f6a5d176c155d9  114545	messages/lv/attr.php
100644 blob b8a5c3d18dcea97167007319aced6251fc197a96   73120	messages/lv/cat.php
100644 blob 76a4f835411d817328ca792730e34289382ae101   13154	messages/lv/info.php
100644 blob abb465be08006ce578d451e9696b0d353af0572b    8605	messages/lv/main.php
100644 blob 0ceda8f6af416d7f7e02348f02da1d62ef4ddc4d    1889	messages/lv/seo.php
100644 blob 72286d9693261e12af8219909e91d3006d8694a8  113902	messages/mg/attr.php
100644 blob 9434120974774aa0d0f110251c9168696b91a3a4   70578	messages/mg/cat.php
100644 blob a255687c7b273b0b708ffa7007a9c5a0999baef0   13141	messages/mg/info.php
100644 blob a99b2c796688ab0686634b58db6b85a9273bc8e9    8565	messages/mg/main.php
100644 blob 28a71d1f3ce67b070fdadf75fae2ac15dd8d337c    1856	messages/mg/seo.php
100644 blob 89bcb0ac5509679631025d7126d88984add174ea  109525	messages/mi/attr.php
100644 blob 20bca66142cf882a9d6732348cdee41c2ecd8a78   68324	messages/mi/cat.php
100644 blob 0f58fd506f29daaede3dac0c6144b196bea3aea0   12101	messages/mi/info.php
100644 blob 00698eadd3bdf83ff7eae06a8a9281f06e510d8c    8243	messages/mi/main.php
100644 blob 848e6101b98baf44aec172903db6264140089154    1683	messages/mi/seo.php
100644 blob 2d0f3a55a230b2350e5844c6b376e15cf329ecc4  141352	messages/mk/attr.php
100644 blob 79dabc9e4b2a6e290f7e03ec66a9394c5fdfcf95   94913	messages/mk/cat.php
100644 blob 5d59a582d6fb3e3079bfcb96ba0c120270725989   21187	messages/mk/info.php
100644 blob f889dd8cf2505fb002d5e2d4adc1be68d00f7b30   11164	messages/mk/main.php
100644 blob 9035e107a23a41b4124ff248b4f9347cea2d58f6    2736	messages/mk/seo.php
100644 blob ca8d573cc3f330bdb34706c704af26bb52bda86f  138028	messages/mn/attr.php
100644 blob bd0c9e8fa262eaf05d977c7f9cb2dda6bf5f915f   93636	messages/mn/cat.php
100644 blob 533d817e955a3df070e675d657dd4b9b1cfd0a14   20330	messages/mn/info.php
100644 blob 9e29c04f313050ba9dd43c23f61de23d145ae262   11086	messages/mn/main.php
100644 blob 0a840400f2cf49f548d7eb08ad6c7b263906b7fc    2546	messages/mn/seo.php
100644 blob 99a2cf00912d813f3d4f117429b583d26a7acc5b  152731	messages/mr/attr.php
100644 blob f988c5977a6f1fff52dd189b6d4c0948bc18f739  105509	messages/mr/cat.php
100644 blob b88bbc87a4ecaaf6ce2af39635a547033065fedc   26943	messages/mr/info.php
100644 blob 66bdc0cc9a29312c023d8882a3f68ae5ff13c805   12925	messages/mr/main.php
100644 blob d21e43c584dc6dc332541eafff914be3f484f8a9    2994	messages/mr/seo.php
100644 blob b410149183b65d935fb7663e88fadb2f7e70cff4  109051	messages/ms/attr.php
100644 blob 559350149cba4f18da2b7ca5e228fecbd8e5c846   68225	messages/ms/cat.php
100644 blob e9d3bb09f762e082d370860af298dbdbdaa83e65   12836	messages/ms/info.php
100644 blob 38b8c2e5cdbad665cc57d28bc8f72e88792dd61d    8294	messages/ms/main.php
100644 blob f71e14d636ab899c35a14c1783b0533587d916f0    1812	messages/ms/seo.php
100644 blob b97078159054db62eba9e29d777e068d5d50801d  162570	messages/my/attr.php
100644 blob ec3993f814d45c13c5704e6db8be17dd2629bdec  115304	messages/my/cat.php
100644 blob 3091906f5a39ddb4e33dc74ff3a2c2d51816ed44   33647	messages/my/info.php
100644 blob b48dffb9bbe6c0b31f0f489e0e7733c8c04c968a   16058	messages/my/main.php
100644 blob fc0ba07662fdc9e92adacee2689c87af45d7e1d3    3854	messages/my/seo.php
100644 blob c9d9c8519f6fc9052e6a155799cfa1eb46ccf460  153098	messages/ne/attr.php
100644 blob 934653228c9438f28f7152ad80a11e80ce0d22e1  105842	messages/ne/cat.php
100644 blob 58b383a55c3ac5be20d5a0f96498e1883c32f618   26738	messages/ne/info.php
100644 blob 4c98c6c28357395958c0423bbf8838817fa7e3eb   13678	messages/ne/main.php
100644 blob c80f5e4cc3e75114ee27bba13b5e7b4633566efd    3000	messages/ne/seo.php
100644 blob bfec8703682346ff8a58c1c66704fd2b9ac73f62  109635	messages/nl/attr.php
100644 blob 4982dae1df4e0af4da99d8d710a9abce46467967   70260	messages/nl/cat.php
100644 blob 588937beb8c34eddd3c3559f45820f381c5d06b8   12955	messages/nl/info.php
100644 blob 38cda4b77882e86b820a8c2d6d89804f1b850a0f    8315	messages/nl/main.php
100644 blob 14b16642bf2e5142507d4761a535833293c70daa    1913	messages/nl/seo.php
100644 blob 6ce20280039277daddfcdef14683156615934125  108781	messages/no/attr.php
100644 blob a54bb7be01845c70f8d8feec87c223ebb2541cad   68794	messages/no/cat.php
100644 blob ad4c602b4067960355277d55410607fe94131807   12465	messages/no/info.php
100644 blob b3c70d541f87f03f4f877def2154f5f9920cfd48    8042	messages/no/main.php
100644 blob af1444123300e92579c91d16785b263d8005699a    1841	messages/no/seo.php
100644 blob 42ea192de6e3f29ae144e46381c0abb286e6d987  113198	messages/ny/attr.php
100644 blob b3c4a836b42716abd94e99b720d0c5305e7b5bb9   71052	messages/ny/cat.php
100644 blob fa8a3b9da1361416875626ec500186fa836cddf3   12542	messages/ny/info.php
100644 blob 7718ada9fe26c35fbeae48a068e6e419f82a8eec    8192	messages/ny/main.php
100644 blob 607440d2e0269c1ddc8cfe0c37b52cfaa8e79f48    1694	messages/ny/seo.php
100644 blob 4d285e2fc55cd75ecc683fa4094abc5a5b47d760  113923	messages/pl/attr.php
100644 blob 5b0e46dc0c1f6065596ffe3ea46f88f177a27e2f   72166	messages/pl/cat.php
100644 blob bbe9b7db88b1b5ebaeccb3d7c609d9df4af99960   13275	messages/pl/info.php
100644 blob 6f63646629742dc555d460170014e7c6dc55ec52    8357	messages/pl/main.php
100644 blob e50f934d660e7cb9998268b639f70559b123065e    1978	messages/pl/seo.php
100644 blob 0b24a0219242ba17e1c6248c966068ae058334ae  124030	messages/ps/attr.php
100644 blob 55285fc9388ad33153478a4a3a2f673fb1ff6ab1   83430	messages/ps/cat.php
100644 blob 8fc2da8cb12697bc2d83253367aeda201587b655   17545	messages/ps/info.php
100644 blob f650d9baf90dd7f34cb1e4de1a3de7889cac1c67   10309	messages/ps/main.php
100644 blob 19a9a482e09ff052b0ca5aaf525c82a8fc1ab6f4    2253	messages/ps/seo.php
100644 blob 84b5848f9d780f64e4e8426a97f4b030f3798223  115012	messages/pt/attr.php
100644 blob 84d256c70be4b8571d41c61bd9ebc3df18393d97   73576	messages/pt/cat.php
100644 blob 172c76ea3edeaf6741ea2911a1223b37af6fab8c   12319	messages/pt/info.php
100644 blob 55c55f367e0ea79817759b270e02254d578f1a37    8529	messages/pt/main.php
100644 blob 5718d93624d52d675964298dd966d25342ffceea    1937	messages/pt/seo.php
100644 blob c2885a7192ed530aa9f171670f22dd25f4514bbd  114394	messages/ro/attr.php
100644 blob f84aae1041aeda20dca2f7662bb30e37a6556f07   72606	messages/ro/cat.php
100644 blob 831835a748e493ac9d24b2c8dbbef296a4c24104   13410	messages/ro/info.php
100644 blob 8d7547d0a08bdc3b2420a1b69844927de59637be    8580	messages/ro/main.php
100644 blob df4895c2d44b93cc056b065d5d6e584306a436b8    1899	messages/ro/seo.php
100644 blob bc94d75bb11de04e995a1b8c884ec295e10961a9  142233	messages/ru/attr.php
100644 blob 5da2a15febb91a775e423400fc39569ffd25e004   98080	messages/ru/cat.php
100644 blob 8af64a0f103a03e74c3c1dd522320bab28d378de   21041	messages/ru/info.php
100644 blob eb8538a22ccfb2c33f8db162c2a0e54c04bc62d6   11298	messages/ru/main.php
100644 blob 29804903ab4da9402dee343fc74ed5ee73f97dc7    2699	messages/ru/seo.php
100644 blob d60931af149aab2c5d7a637d739d2c97b88dc07e  154999	messages/si/attr.php
100644 blob cef0a939640da6a774403eff4323ea500a8b369c  102403	messages/si/cat.php
100644 blob ecf88ac06525bf5da84402f0c718367411b6259a   25661	messages/si/info.php
100644 blob 28d8438131c29c42b8d22f5907f4bc9812eb6b42   13164	messages/si/main.php
100644 blob 299c59549252940c3bf49560faf6e4c027d73545    3150	messages/si/seo.php
100644 blob 1387a87a7b240d7d992651090a0b2ce88d9e7422  112118	messages/sk/attr.php
100644 blob 5384e16ba73e644c93a4dc292c61b993df1362a4   72612	messages/sk/cat.php
100644 blob 465a3423402f66952d2f756871cb916c192d45d5   13160	messages/sk/info.php
100644 blob bc1913dd962fa5f0c937ef43f0b78c36d51ca9a2    8391	messages/sk/main.php
100644 blob cceb9313b70dd4943bea7fb500c7bbd18a268131    1953	messages/sk/seo.php
100644 blob e850c9cd3f0b5ec2ddb3d6b5ab6db19d2e74be71  110918	messages/sl/attr.php
100644 blob 416a32a98ee527e2868aa9472970e1d61d758de2   71208	messages/sl/cat.php
100644 blob 409d201f2ee10d35a7a60745520055bda7f0fad5   12283	messages/sl/info.php
100644 blob 340d71837db0042f1a71700efe03e1cec85861e2    8033	messages/sl/main.php
100644 blob f21e988f70633ca11eaa1a61ae7471c589e663bc    1882	messages/sl/seo.php
100644 blob 49f81e75a23cf36eeeb689a70903b3284ed3d9de  115644	messages/sq/attr.php
100644 blob 484a05ae6aa75527bbe91e95bb2cdf2ac4995b2f   72749	messages/sq/cat.php
100644 blob 2510a4e8fe069662f5e8af1a83007ea3eb63f11f   13795	messages/sq/info.php
100644 blob 8a3e4565488d67c7af3060e8838ac227dc455be2    8583	messages/sq/main.php
100644 blob 2a568883d1e69357acf1a6c7cd8a0446d0fad4db    1983	messages/sq/seo.php
100644 blob cebde39ee1c77898432120ad99ad9487f246aa1e  135501	messages/sr/attr.php
100644 blob 3ed940e4c4aecfcca401651a91be637ec60fd96e   93109	messages/sr/cat.php
100644 blob 465fbdfe1a4613529a1f8753e9ffdbd4a9c90af5   19367	messages/sr/info.php
100644 blob a6a1f13f552ea78a1a26cb8194f681f923612553   10621	messages/sr/main.php
100644 blob 5176771deb32de984cb4eae5b1a76a790718b688    2657	messages/sr/seo.php
100644 blob 0d5ccd725fcd7c27b15dbe0a7f09366029a31959  113990	messages/st/attr.php
100644 blob 8aa71b6513c693e1e9bde715e2e5914bb44671d5   74177	messages/st/cat.php
100644 blob b16db796e474caada45afc20ac0edae001e6910a   13945	messages/st/info.php
100644 blob 983c91af00b336dd3c58aeb18051a83185bcde69    8448	messages/st/main.php
100644 blob 8ea93cfa2a773bdcb200b16ee41c97667b42c92c    1914	messages/st/seo.php
100644 blob 425f7eb018ccfb7be74c25f429bec89c4ae4f9f0  108722	messages/sv/attr.php
100644 blob 9cae895d84da40790b270c2d0261464fea412d12   69209	messages/sv/cat.php
100644 blob 16affb3a422137e98923a9fa2226fe921fc799b9   12761	messages/sv/info.php
100644 blob a5afca62f7b691bb2ec6bd70e56c6cc65b5b9e24    8107	messages/sv/main.php
100644 blob 20726cc152691bc0420ee235bed69c1149e9541e    1812	messages/sv/seo.php
100644 blob 475209d05aa2121fa7a5f9d4558ebd03099fd113  111710	messages/sw/attr.php
100644 blob fdb5ac658be2492923fd390ba8de6d285ef1a2ba   70793	messages/sw/cat.php
100644 blob e9e4215fe5443cf1a4086fd465e901c14b08595d   12390	messages/sw/info.php
100644 blob baa2afd8ad3987f43641cbff50bc5fdff32058b3    8139	messages/sw/main.php
100644 blob 2c977baef046f1deb5942b6889f78c2ba301c00d    1841	messages/sw/seo.php
100644 blob 0ac7521a4b12d4d29de08bfa433ac0144cb3d695  167287	messages/ta/attr.php
100644 blob 2f41f89d2d0a6a2e65a82a3ceffe4474778ad011  122314	messages/ta/cat.php
100644 blob 879be3cbc7602e5e963ec1277807a9a3479456dd   28469	messages/ta/info.php
100644 blob 911cc6259907d44e4b93e58a9808f75d0ba98b67   14894	messages/ta/main.php
100644 blob 27a7e39e68d2a6576884cce1f2c10dce14fddfd8    2868	messages/ta/seo.php
100644 blob 0a202a36883e5a9f56dcc2605880bd4b553960e9  159894	messages/te/attr.php
100644 blob 0165d8c4fb97f48874d12f885591d2695333b27f  117873	messages/te/cat.php
100644 blob 8923ad991ca4f460731bd202c50e82bfd9ad99ad   27503	messages/te/info.php
100644 blob 7070c04b741bbc483b58aa3fd8e3cbfd8b39b384   14050	messages/te/main.php
100644 blob b25820e25087b04e638783a671f3834d6da47947    2899	messages/te/seo.php
100644 blob 380b8a45b306e1567d57e075a10500b4dd9c4a6a  135261	messages/tg/attr.php
100644 blob 3a4eb69d524688d0ace0d3dac50bd5f4383628d8   95196	messages/tg/cat.php
100644 blob de321a6f0dbde95553615166abfbd6bd2c115c3e   20041	messages/tg/info.php
100644 blob 9368bf43e07173ce05ece7c773247e36a84cff1a   11319	messages/tg/main.php
100644 blob 6661d1a1175e56db2ca7568796bf0330a88c77da    2580	messages/tg/seo.php
100644 blob 61a126f69bf0a64222e8a23f963e8cfd65dae16e  159013	messages/th/attr.php
100644 blob c42368b677477b41c9d60bf441386a64871c2743  108935	messages/th/cat.php
100644 blob 68ead20c66c479649b51fe2bd23c5b9423c72db7   26331	messages/th/info.php
100644 blob 4ef84003525d4cbd8295ad013c8be6d48c8ae675   12860	messages/th/main.php
100644 blob ce7b6be25160df52294b6ed7e7748cbc11d8f662    3248	messages/th/seo.php
100644 blob 17625f2d4c38634fcb6b8cab1e41fb76a052233e  113165	messages/tl/attr.php
100644 blob 90fd863ca01073f6a8bdb1edf342a8b73ba1af0c   72057	messages/tl/cat.php
100644 blob cf11071388a8528a53a43bcb10d3a50e2c7019d6   14176	messages/tl/info.php
100644 blob 64782f28ed299275628d9c73c682e498b017b2d5    8828	messages/tl/main.php
100644 blob 8fb6715a0d726a07511de1ee20a8eefd487ec517    2007	messages/tl/seo.php
100644 blob 4e4c0c00fc7149843a465e2aa5d0478303aa5b37  139613	messages/uk/attr.php
100644 blob a9eb628785d0a32823cb920676ddd68c2a700b27   93901	messages/uk/cat.php
100644 blob 8b3a96dbe8b33f593e95d931939c070415ec4d66   20899	messages/uk/info.php
100644 blob f04947815c4482561fe6c7ff348b128b56c7ca9d   11024	messages/uk/main.php
100644 blob bafbf91af7615e2de88c710602ee14590abfbcef    2616	messages/uk/seo.php
100644 blob cf4ab6d229a154afe25ddb8aed5280a72bf1e9f7  127536	messages/ur/attr.php
100644 blob 9a9357fc86ce3aa89f10e2464b46fc49010ca2e8   82580	messages/ur/cat.php
100644 blob 830245856260a751d280fa973c5caa4d077a0abb   17771	messages/ur/info.php
100644 blob f75f1617f86a809a693e7b0438fc592faf4e8959   10393	messages/ur/main.php
100644 blob f908bed18a5a1945b99d75329ce14f8fb1d110b4    2230	messages/ur/seo.php
100644 blob 8704be8e98efd8f24b963f8c4e10a0cee91bfdc8  112313	messages/uz/attr.php
100644 blob d2c9e51068dda95c7e5d9cc589a09808848f42b1   74216	messages/uz/cat.php
100644 blob 819ae394a4cc36c83c79e14a5f56be90d296475b   13078	messages/uz/info.php
100644 blob d7fd0b453678fd1509c94fdc658448d2e7cefcc0    8708	messages/uz/main.php
100644 blob fa89a91152fa42f01e3f79940beb3f0c65a9778e    1944	messages/uz/seo.php
100644 blob 37620d03e4a9c7d1aeddfc6df1e107239c03efbe  121662	messages/vi/attr.php
100644 blob 1a5e83777fb274113a36e3b670bddc4f17bc0ca7   77406	messages/vi/cat.php
100644 blob 1465334b452c1c8323eba68018116bf759d7863c   15770	messages/vi/info.php
100644 blob 586e013aa1f97aa2a3d86d55a60e62929885f7f9    9442	messages/vi/main.php
100644 blob d04c84c8a42db7f0898dad7596011c6462e6e4dc    2107	messages/vi/seo.php
100644 blob af7b181c03f156c3ead1c44e8771db5eae57aad2  115687	messages/xh/attr.php
100644 blob 51f3d989bb30e2206a22b4fdf3d0280a37f0855f   73611	messages/xh/cat.php
100644 blob e44dfaafeaf7aaa9ec59c573be5e5b5c5e4ea732   13491	messages/xh/info.php
100644 blob a666925a8216eb8820035452a0cbb9ab765bd666    8534	messages/xh/main.php
100644 blob ba81325e62e114d864f58390a87ed025a47c7a7c    1880	messages/xh/seo.php
100644 blob 49845b85aadb62ec673be3536f1b628d30b9b2ee  115778	messages/zu/attr.php
100644 blob cfd8a7e260210ce35cc2b7187536d946c9c054f5   74024	messages/zu/cat.php
100644 blob f26233ba0948a4bacf074dd35e1d7e8ad701e5a1   13632	messages/zu/info.php
100644 blob c679f114148fba95c9ee2174ae24b3b9f2412601    8561	messages/zu/main.php
100644 blob 42edd59c87b097adc73eae65316f2980ce1e9b53    1918	messages/zu/seo.php
100644 blob f001d21926f26c384f217cc9f0eeb44e5cb404a0    1590	models/ContactForm.php
100644 blob 8127d15d064d3b9568625874bad3081cde499088    2048	models/LoginForm.php
100644 blob 594d36fbab43a8a5f088700b97380eb28437af17    3466	models/SnSiiCart.php
100644 blob 112d94330a5ca6df75030967f65efe5793c0d8d0    2039	models/SnSiiContact.php
100644 blob c65f74e0de1237b82dee52d84bbcd26ed97fafdd    1396	models/SnSiiInfo.php
100644 blob 22d9bb00a0f1811247b7793797d141f5c5405fd3     936	models/SnSiiInfoCategory.php
100644 blob 9b5dcf1e8c3f37b30e3c11a83b39b7b636c89a65    2539	models/SnSiiNews.php
100644 blob 434234b0e4b35dababa26e037221c91a70163e0c    1042	models/SnSiiNewsCategory.php
100644 blob 5242976464309d68de2b3a33833f747a5aa96d94    1003	models/SnSiiNewsTags.php
100644 blob 667a3f106a6bab422095ff6c288a3c7b846a2884     774	models/SnSiiNewsTagsIds.php
100644 blob d802f18e6c495d382d26f3c0d367db0b07d074d0    3911	models/SnSiiProduct.php
100644 blob f7fa9d441a4031c44ed6c134823115a432a20fe6    2166	models/SnSiiProductCategory.php
100644 blob e9568f9b00f6682c297765dc431edd30e4e7b8c9    1324	models/SnSiiProductHot.php
100644 blob 370c54bacdb116db8bf7c306cdee3fac00de85d9    1061	models/SnSiiProductSearch.php
100644 blob 0a5d62359e4711451432ca647c5f5581e2e02e9f    1029	models/SnSiiProductTime.php
100644 blob 3251194298764edfe7b386be6ba7f4b0dd4eeccc    1092	models/SnSiiProductTimeList.php
100644 blob e012d686b0596ce5e9bff116b2b02636411a8167    1666	models/SnSiiSupplier.php
100644 blob 56bf17743ede875a69ce77fab965e004d1ebb5fe    2359	models/User.php
100644 blob 27a730f5ded8bd6921e6c69c25a76e02c9f676a6    1895	modules/ejadmin/controllers/AccountController.php
100644 blob b3a2cf857a470060d9f938063ca4f6e160968722    2995	modules/ejadmin/controllers/AdController.php
100644 blob c9c9648dd4f1f40df4cd40cd2f8b15202d9d8599    1769	modules/ejadmin/controllers/ApiController.php
100644 blob e8324052ef2b6f6e33c1e4fa7bccea08a019a9d3    3928	modules/ejadmin/controllers/CategoryController.php
100644 blob e4a43f87926a934a28690854d7a4ca242b8fc578     385	modules/ejadmin/controllers/DefaultController.php
100644 blob 338de75f4c3b6941d4d8c5c9d0c2d191cd15cc85    5603	modules/ejadmin/controllers/HelpController.php
100644 blob 52275e2a6dcb911e77ff1c3230e991a515e2123a    5636	modules/ejadmin/controllers/InfoController.php
100644 blob 8f6c1f8db8e07392a4af0d537fa62285a36d605c    2923	modules/ejadmin/controllers/ManageController.php
100644 blob b127dd6f67e9238020963349cdaf4b2799c06b58    5847	modules/ejadmin/controllers/NewsController.php
100644 blob ffabeb415cac509cd8aaf21493730fc84e9fa939    8125	modules/ejadmin/controllers/ProductController.php
100644 blob af3dd7ab4c05b8532ad892d4187f781b0f06b8f1    1862	modules/ejadmin/models/SnSiiAdSearch.php
100644 blob 0747b39498dcb9754b98f20ad40e88f2a4d0392b    1751	modules/ejadmin/models/SnSiiAttrNameSearch.php
100644 blob 2f2e2f8f6edfda972f58ca7e9e7f02e7f10f6371    1710	modules/ejadmin/models/SnSiiHelpCategorySearch.php
100644 blob fde11afbc69133820f1c5dce39079f80fc04f6d5    1600	modules/ejadmin/models/SnSiiHelpSearch.php
100644 blob d13d0599b69c5dc73c020f97921e717e903ac491    1642	modules/ejadmin/models/SnSiiInfoCategorySearch.php
100644 blob caf381aaf9abb0b49aedcea6c75bc915b3b70eeb    1600	modules/ejadmin/models/SnSiiInfoSearch.php
100644 blob 1ec044c300a881413d99dd403e86a357927304db    4260	modules/ejadmin/models/SnSiiManage.php
100644 blob 31683d22b0a99e9c71ede3ac17eb00edd8cead45    1938	modules/ejadmin/models/SnSiiManageSearch.php
100644 blob 5fac49f04dbaa216e03ed1e1deab82c5381bd0b4    1083	modules/ejadmin/models/SnSiiNav.php
100644 blob a3620f33b6c397470699f36c01b06368adc9d490    1642	modules/ejadmin/models/SnSiiNewsCategorySearch.php
100644 blob 44dfaa42daf6f34514af5fb2da0cd8b3066f140b    1917	modules/ejadmin/models/SnSiiNewsSearch.php
100644 blob e264f4621884cc1b5465d251363f5f73505f5ea0    4911	modules/ejadmin/models/SnSiiProduct.php
100644 blob aa7dd1fa5c61fb2d84f94251e32b27176ae964fc    2075	modules/ejadmin/models/SnSiiProductCategorySearch.php
100644 blob 9fc0a3dd8231800f0f80670adf8cdb5846734e29    1854	modules/ejadmin/models/SnSiiProductHotSearch.php
100644 blob 00af514bf2487d98d1303c3358eedcef27d47f22    3208	modules/ejadmin/models/SnSiiProductSearch.php
100644 blob f317ddd49a4947583052ffd10b239716ed3f6ce7     380	modules/ejadmin/module.php
100644 blob 16437d11780adcdde64652bac5c671c27439605b    4382	modules/ejadmin/views/account/edit-pass.php
100644 blob b911c38979dc2fd39dbc3ee07935675405aec34a    2257	modules/ejadmin/views/account/my.php
100644 blob d61a90f8f29871f5159c896260c2a4a61de1e6d0    1493	modules/ejadmin/views/ad/add.php
100644 blob 9bd8f543bb43e180e676e084a16fd9ff4d86d45a    8451	modules/ejadmin/views/ad/chart.php
100644 blob a1e3b93feacaf35771731f85a9d075ad0f542273    1507	modules/ejadmin/views/ad/edit.php
100644 blob 89f2f251f45b2dea820c0b5b278e2850022a6075    3517	modules/ejadmin/views/ad/form.php
100644 blob 6a5d10212f41ae0459ec9d38a32b3c01f6ebc750    2817	modules/ejadmin/views/ad/index.php
100644 blob 2eae48586ff138e88dc6acd2ab354f8129b06e69    3060	modules/ejadmin/views/category/attr.php
100644 blob ca09694bd9919dda0acbe7e368769d8f4b63903a    5361	modules/ejadmin/views/category/index.php
100644 blob ffff8cdc4a6f7950820b724f3c450d74353f4661   68527	modules/ejadmin/views/default/index.php
100644 blob 0b1b6116047814e56035583b5e5d1404b2b67af0    1350	modules/ejadmin/views/help/add.php
100644 blob 3c31a15172c50587553336874f89b7d94a5ffe42    1513	modules/ejadmin/views/help/category-add.php
100644 blob a8844ed6261270c083fb6b0216abd78ec786c5e4    1351	modules/ejadmin/views/help/category-edit.php
100644 blob 675f4c0a7bb007980df9dfbdfc5f05a5017358d6    2980	modules/ejadmin/views/help/category-form.php
100644 blob 466cb784acd34ded269d9b30aa666c17cadda4ad    4043	modules/ejadmin/views/help/category.php
100644 blob 9c74698c4bb9023adecbef92f07615b8387bd148    1335	modules/ejadmin/views/help/edit.php
100644 blob 2e2bee0a4f9557a16bf1c7a033ac23e4f9e96ab3    2969	modules/ejadmin/views/help/form.php
100644 blob fd05dc775561f2e2ab3a26ae9974efdf9406ead2    3905	modules/ejadmin/views/help/index.php
100644 blob ef8b6ab2ecd527724da14e896daeb05270ddb702    1350	modules/ejadmin/views/info/add.php
100644 blob cd731984e4aaf0dd8af10552b70d65b6a5b232ed    1513	modules/ejadmin/views/info/category-add.php
100644 blob a8844ed6261270c083fb6b0216abd78ec786c5e4    1351	modules/ejadmin/views/info/category-edit.php
100644 blob 471196523e002b571ed3f0360a50281cee6f2730    2784	modules/ejadmin/views/info/category-form.php
100644 blob 9c94cebca0161d014917dcd8fd3cf85da8efe27d    4049	modules/ejadmin/views/info/category.php
100644 blob 874b10210688540c50efc776abbd5128e6939252    1335	modules/ejadmin/views/info/edit.php
100644 blob 44674c6a611a2b1a637955c40884834dde1a43fa    3565	modules/ejadmin/views/info/form.php
100644 blob 3a922e5fb9fa7db9669b9eb5a9e2256ef3178f6a    5342	modules/ejadmin/views/info/index.php
100644 blob 531a563dfa284dd23244ffad92f5a5d3f98acd14    2430	modules/ejadmin/views/layouts/ejadmin.php
100644 blob 13f8d0b7800574c548df649f6f638820ba9ec95c    1008	modules/ejadmin/views/layouts/footer.php
100644 blob 88839438a7256e2ba0eea893e5c7da8df4163376    3523	modules/ejadmin/views/layouts/header.php
100644 blob 1602f09e75868531753742ca4f67618d2f7494ee    1493	modules/ejadmin/views/manage/add.php
100644 blob bf46b1c790a71ab3a64a7d991f790388f3ee0c12    1532	modules/ejadmin/views/manage/edit.php
100644 blob 6e384a15904573542f9e1ebeced9751c7892bb0b    3912	modules/ejadmin/views/manage/form.php
100644 blob 65b6a1f31bde757e740ef9f9a62db3910c4ec3e7    3160	modules/ejadmin/views/manage/index.php
100644 blob 0b1b6116047814e56035583b5e5d1404b2b67af0    1350	modules/ejadmin/views/news/add.php
100644 blob 3c31a15172c50587553336874f89b7d94a5ffe42    1513	modules/ejadmin/views/news/category-add.php
100644 blob a8844ed6261270c083fb6b0216abd78ec786c5e4    1351	modules/ejadmin/views/news/category-edit.php
100644 blob fbf01b1fc8821942187f392995eeab620af1e134    2785	modules/ejadmin/views/news/category-form.php
100644 blob 034ba65edbca6afa127a0ac04c7880b47df618ef    4043	modules/ejadmin/views/news/category.php
100644 blob 9c74698c4bb9023adecbef92f07615b8387bd148    1335	modules/ejadmin/views/news/edit.php
100644 blob 0362d256fda4bfff6816a381333abe965749aa29    4406	modules/ejadmin/views/news/form.php
100644 blob 18ec7c7c24d72c2f031ebae96a191a1cf7c4c3ef    3945	modules/ejadmin/views/news/index.php
100644 blob ceb5e1d5ae0aedd58efc19d46722c8c585f43b39    1493	modules/ejadmin/views/product/add.php
100644 blob 370e75ab6f83db0f7fe652a5fac2873f11d4a27a    1507	modules/ejadmin/views/product/edit.php
100644 blob 6ff599526cd222cbb90a2c81dfb4df6869aff2c1    6101	modules/ejadmin/views/product/form.php
100644 blob 359f93c9979814991b1585b32dd14d338cedc99f    1944	modules/ejadmin/views/product/hot-list.php
100644 blob 701986ff1ccaa04ec28e7994bf7b96090066eb25    1517	modules/ejadmin/views/product/hot.php
100644 blob abcf30789b4ed6f17267dcf46eb9e0918d95aa98    3928	modules/ejadmin/views/product/hot_form.php
100644 blob fb315c56cd19672560ae4c4c57cdc93740375274    5384	modules/ejadmin/views/product/index.php
100644 blob 6cf322eb0e44ba1026e2ae721d4b2d74e9c75968    5860	requirements.php
100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391       0	runtime/.gitkeep
100644 blob ab7f339dd6d7e5a3728800bd1e41f80f0ce4b7e9    1872	service/MailService.php
100644 blob ead2c3fe35d3ee2ddbc412eca168d3852e46d64a    1794	snsii/ActiveField.php
100644 blob c00e569a278f9f64b9f777ad9adc9de96acd044b   18420	snsii/Cf.php
100644 blob 69fcea94f78e33c0c2d24b8eeae84509c90c081d   18074	snsii/Curl.php
100644 blob 54f90a34ce95e8ab61a5baf3787aba4f06f851cc    1739	snsii/Db.php
100644 blob 0d30b5b8ab8fcef6927a8288590673f989ec78dd   12698	snsii/Form.php
100644 blob 295c0900d5f198e3e607975422566cffadd0c7f7    1245	snsii/JsBlock.php
100644 blob 6e15af6d147215eeb51d34730a5b20a6335682df    2838	snsii/Lang.php
100644 blob 4659895d4af86965df27ec2b2a690752c5e0ab6c    1056	snsii/LangUser.php
100644 blob 29bc87a6c646c4f34c16c4add972e202a94533d1    1667	snsii/MRow.php
100644 blob 8adbaa4df34a66edc8fbb0aeb9be46064636a2e3    1134	snsii/PageCache.php
100644 blob 5d0bc92690c713c3679b7f9788b20d90e6ba7607    2037	snsii/Pro.php
100644 blob 06bc49aa97b1cf5f8907a4b6474b677fceea5bb0    5911	snsii/SnSiiLinkPager.php
100644 blob 5d7ab55b27628edbc55697e8ea643663d331bdc3    1696	snsii/Str.php
100644 blob 1a01ea9ed7ad6218a24547d3481a466f338d427d    4127	snsii/Url.php
100644 blob 7b8e9b210f8cb2dec4c2e632f979088c9d202c7b    3343	views/blog/index.php
100644 blob c536ac5d95c032120d98d62a10c200711e1a0dbd    5667	views/blog/item.php
100644 blob 6611c22e14a2a2ceddf1bbdd16706d8f3a0278a1   13945	views/cart/index.php
100644 blob d4a72004d60974ec4f62c5a326b4674712d56e08    6913	views/cart/index_bak.php
100644 blob 81db494825bc8fa71a8285bf5f703d9b3ac04446    1445	views/cart/success.php
100644 blob 472a5194d6dce3cf98044793965fe2e3756f6903    1392	views/layouts/breadcrumbs.php
100644 blob 2c65de5b4381a2365b012ecc078c0132fca461a7    7621	views/layouts/footer.php
100644 blob 9f8c79e1ec28ca7c0b6be4e258c9e91f7111813e    9104	views/layouts/header.php
100644 blob 213e3deaa4da478a9d1ca1b3f8ec63002d7e4835    4682	views/layouts/main.php
100644 blob c77e06a4710697e9648603646d1dcbd38b53c398    2441	views/mfr/index.php
100644 blob b6e70ff337b140a0f9c8a31243da64bddac4aef9    2174	views/mfr/item.php
100644 blob fcc6936f313f6d480f480b37cd9d46711dcbf930    6506	views/page/item.php
100644 blob 1cec4e033a425f2a17488ffb4cebc5d8a42cd8d2    1718	views/pro/index.php
100644 blob 386c23e007e53c7b42af8e561dac28c90c83b324   22702	views/pro/item.php
100644 blob 77246fda580b1329abb6190cac78a8dca336644a    2094	views/pro/list.php
100644 blob 7994aae3600292f4bc41559e00832a89cebb638b    2886	views/pro/new-product.php
100644 blob 5c5ab50dafa602067ae7245b2ecd2fc25fff2a5e    6233	views/pro/sub.php
100644 blob 3c09ef73281c999403ef577c7ef427f785cd25d0    3263	views/search/index.php
100644 blob 7f6f1e3fc36c96aa0bf1b4d5be2b6c4b61d9e578     503	views/site/error.php
100644 blob 39e3936c3c3059700f95a8896c64d6d93cc0c7b4   15988	views/site/index.php
100644 blob ebd59527451958bff4dd58b251e0d5619995437b    2111	views/user/forgot.php
100644 blob 60aa5bea960d603310d6f61315bc903165c9a566    5187	views/user/login.php
100644 blob 197199e8d5ceadd4d8f0679f8bbb9dbed1ded8c7     117	web/.htaccess
100644 blob ac399e7deae43b864fe185e7204af8dc0e80ee8a      45	web/.user.ini
100644 blob e158a6fb4820bb0c8fd336328cea9dad6f177ed7    2232	web/Inquiry.html
100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391       0	web/assets/.gitkeep
100644 blob 5d5435ec3571616b0ffe2a6c6148c89932b8627e  330339	web/css/style.min.css
100644 blob 2598fd480299af1041d94546cf444071a41ef38b    2122	web/css/tiny-slider.css
100644 blob a5fe222a20161380a811e803266fb83690611904   36500	web/dw0020a.png
100644 blob 28024498bce1618fe19317e9f5feed623d2f798f  229018	web/fonts/cartzilla-icons.svg
100644 blob a306352a3e74f103728a2b6cffea262cebd92de0   67232	web/fonts/cartzilla-icons.ttf
100644 blob 36d7d3e305431eb7ffda26b3b92e3230e87bdc44   67308	web/fonts/cartzilla-icons.woff
100644 blob 51264c4fda25feadb007e30ab69bf9b0ddfc1cee    4024	web/fonts/lg.eot
100644 blob 83d681f11090d65fed87f992dfb4ed3b4d368698    8858	web/fonts/lg.svg
100644 blob 8ad81996ef9e77235081cad58d7c138c320b4487    3880	web/fonts/lg.ttf
100644 blob d98ff6054dee550d713288ed87dc95c9532d0a7f    3956	web/fonts/lg.woff
100644 blob c982210c5e764003b9000995a527ef80373995e7      53	web/googleb991a44b3bb04faf.html
100644 blob a61c6c857139b953e7549636906c3d0dc8dc38ff      53	web/googlef94320f35b299f47.html
100644 blob 97c2058d436767e38e954f5d0474185afbba6d5c   33530	web/image/1P1G125QDCKRG4Q.png
100644 blob 89cd9aead9b0f289d3097a8de6ce14ac5d80e10a    2392	web/image/3224W-1-504E.webp
100644 blob 51ff5d711ea8adfcab5bdccb3357595e1c358b2c  134107	web/image/BM08B-SRSS-TB(LF)(SN).jpg
100644 blob 4666f64e9e1f3fa14a88ad8753a6de3fecce82d7  103828	web/image/BM09B-GHS-TBT(LF)(SN).jpg
100644 blob edc8c361f5fe97f643b0355027f6ef6f6d5f2602    3712	web/image/BZV55-B68.jpg
100644 blob d80b24493951d874a1700f57f4e06056ff705a06   39533	web/image/LM5121MHX-NOPB-873429.jpg
100644 blob 6014122780dc5352c1fef631876a74bf8010445e    2458	web/image/Nexperia_SOT1220_DFN2020MD-6_SPL.webp
100644 blob 4ce0a84219884e59373f69e7ac8de3638f48524e   65170	web/image/SN74AUP1G57DCKR.png
100644 blob 17981ba0b00a0067431696cd03ce4356fafd5f3a   37643	web/image/aby0625a.png
100644 blob 02d5e1da9ad2baa1a1b504d8186c88bdc2d27624     367	web/index.php
100644 blob 0ded08eed662eb67f8901b5e455020274b12a171   84330	web/js/bootstrap.bundle.min.js
100644 blob 44d24b32ffc16f46a62639c4cbaa6868c3a82354   63467	web/js/bootstrap.min.js
100644 blob 0610130e973ea7642bccd4341bfd01afae029bb4    5363	web/js/cart.min.js
100644 blob b0614034ad3a95e4ae9f53c2b015eeb3e8d68bde   89476	web/js/jquery.min.js
100644 blob 36b4e1a137828dc488ed9a2e704b74cb35815759   72380	web/js/jquery.slim.min.js
100644 blob b55310eb7001fd94362c68ea4070c217c93b67a4   13891	web/js/main.min.js
100644 blob 0d172caa8001ca179b5cfaa97bc049b3d6292eeb    5485	web/js/smooth-scroll.min.js
100644 blob af1bdf4b90dbb666e0ef74a644d205aa98136864   31684	web/js/tiny-slider.js
100644 blob aa97610cbc243926591662e1e4684b5dfdf98811     547	web/robots.txt
100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391       0	web/upload/files/.gitkeep
100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391       0	web/upload/images/.gitkeep
100644 blob c3c2d19dc8f2fdbf6bb6a264496d808b430a9b53      31	web/upload/thumbs/.htaccess
100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391       0	web/uploads/.gitkeep
100644 blob b3d4ed746babb3dec15ff1b9e632f7ecb1594faf    8425	web/whatsapp-icon.png
100644 blob 2a2e8ede77f5657cdda52980e1df53c447c5736e     553	yii
100644 blob d516b3a1925bb650c601f60ff57ea057f92eaa5f     515	yii.bat
```

---

## 3. 7 个内容变更文件

### 3.1 文件级哈希与字节数

| 文件 | 来源 SHA-256 | 提交 blob SHA-1（Git 对象 ID） | 来源字节 | blob 字节 |
|---|---|---:|---:|---:|
| `config/db.php` | `0f86a8ec04e1aa2ca27fa635e16deb991a09036f3f3ac5c69220ca2ec9a1cd7f` | `bfdf1348670da2bfc6b5d8a0fd43054c0b1c0c6c` | 382 | 457 |
| `config/web.php` | `0bfe970207143b1786b050701d50cfbff7132f3a032cd63b2acb359ef80be00e` | `8d6cf975ed5e7831e1a729a191e492555236b221` | 6,459 | 6,585 |
| `config/console.php` | `1317d8b8ccf0c006d398eb0920efc991078a41638aaf6424f8a3e753b703bd84` | `33ee01e3dd87724afe9c93e56954d4608ce7bdf6` | 2,483 | 2,589 |
| `models/User.php` | `0a3ce8b3f335a7ae2557889358838584e7ed1b7d610501b1b1c77ba4cdcac997` | `56bf17743ede875a69ce77fab965e004d1ebb5fe` | 2,359 | 2,359 |
| `snsii/Cf.php` | `3263f21f0ffe86691816fc5880ee7cfeae76661baa9f0492c6dd522cd7e88f10` | `c00e569a278f9f64b9f777ad9adc9de96acd044b` | 18,585 | 18,420 |
| `.gitignore` | `e9a339f2fcc9faead0d7eb109bd115d1fab0d5e26d965656b77cee8715a9566a` | `4a8c700bc54898f352b888eea04c09a9c2aa5343` | 435 | 696 |
| `README.md` | `ae4a716a90e04c8fb272c6e76a58ad95be081d1641a8a2d9c8fd7ae7cbfa1ad3` | `f77aebb3a6b6274cda74616ae4569bcdd7c9e9b5` | 7,394 | 4,562 |

### 3.2 逐文件 diff（已脱敏）

> 标记含义：`<REDACTED_DB_PASSWORD>` 等为原凭据值；`<REDACTED_ACCOUNT>` / `<REDACTED_SMTP_USER>` 为账号标识；`CHANGE_ME*` 为提交中实际存在的占位符，未脱敏。

#### 3.2.1 `config/db.php`

```diff
--- a/config/db.php
+++ b/config/db.php
@@ -2,9 +2,9 @@
 
 return [
     'class' => 'yii\db\Connection',
-    'dsn' => 'mysql:host=localhost;dbname=morris',
-    'username' => '<REDACTED_DB_USERNAME>',
-    'password' => '<REDACTED_DB_PASSWORD>',
+    'dsn' => getenv('MORRISHK_DB_DSN') ?: 'mysql:host=localhost;dbname=morris',
+    'username' => getenv('MORRISHK_DB_USERNAME') ?: '',
+    'password' => getenv('MORRISHK_DB_PASSWORD') ?: '',
     'charset' => 'utf8',
     'tablePrefix' => 'snsii_',
 
```

#### 3.2.2 `config/web.php`

```diff
--- a/config/web.php
+++ b/config/web.php
@@ -15,7 +15,7 @@
     'components' => [
         'request'      => [
             // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
-            'cookieValidationKey' => '<REDACTED_COOKIE_KEY>',
+            'cookieValidationKey' => getenv('MORRISHK_COOKIE_VALIDATION_KEY') ?: '',
             'parsers' => [
                 'application/json' => 'yii\web\JsonParser',
                 // 允许解析JSON请求体
@@ -51,15 +51,15 @@
             'useFileTransport' => false,//这句一定有，false发送邮件，true只是生成邮件在runtime文件夹下，不发邮 &#65533;
             'transport'        => [
                 'class'      => 'Swift_SmtpTransport',
-                'host'       => 'smtp.gmail.com',
-                'username'   => '<REDACTED_SMTP_USER>',
-                'password'   => '<REDACTED_SMTP_PASSWORD>',
+                'host'       => getenv('MORRISHK_SMTP_HOST') ?: 'smtp.gmail.com',
+                'username'   => getenv('MORRISHK_SMTP_USERNAME') ?: '',
+                'password'   => getenv('MORRISHK_SMTP_PASSWORD') ?: '',
                 'port'       => '465',
                 'encryption' => 'ssl'
             ],
             'messageConfig'    => [
                 'charset' => 'UTF-8',
-                'from'    => ['<REDACTED_SMTP_USER>' => 'admin']
+                'from'    => [getenv('MORRISHK_MAIL_FROM') ?: 'no-reply@example.invalid' => 'admin']
             ],
         ],
         // 'mailer'       => [
@@ -68,14 +68,14 @@
         //     'transport'        => [
         //         'class'      => 'Swift_SmtpTransport',
         //         'host'       => 'smtp.gmail.com',
-        //         'username'   => '<REDACTED_SMTP_USER>',
-        //         'password'   => '<REDACTED_SMTP_PASSWORD>',
+        //         'username'   => 'CHANGE_ME',
+        //         'password'   => 'CHANGE_ME_SMTP_PASSWORD',
         //         'port'       => '465',
         //         'encryption' => 'ssl',
         //     ],
         //     'messageConfig'    => [
         //         'charset' => 'UTF-8',
-        //         'from'    => ['<REDACTED_SMTP_USER>' => 'admin']
+        //         'from'    => ['CHANGE_ME_SMTP_USER' => 'admin']
         //     ],
         // ],
         // 'mailer'       => [
@@ -85,13 +85,13 @@
         //         'class'      => 'Swift_SmtpTransport',
         //         'host'       => 'smtp.morrishk.net',  // 替换为企业邮箱SMTP服务器
         //         'username'   => '<REDACTED_SMTP_USER>',
-        //         'password'   => '<REDACTED_SMTP_PASSWORD_ALT>',  // 需要替换为实际密码
+        //         'password'   => 'CHANGE_ME_SMTP_PASSWORD_ALT',  // 需要替换为实际密码
         //         'port'       => '465',
         //         'encryption' => 'ssl',
         //     ],
         //     'messageConfig'    => [
         //         'charset' => 'UTF-8',
-        //         'from'    => ['<REDACTED_SMTP_USER>' => 'admin']
+        //         'from'    => ['CHANGE_ME_SMTP_USER' => 'admin']
         //     ],
         // ],
         // 'log'          => [
```

#### 3.2.3 `config/console.php`

```diff
--- a/config/console.php
+++ b/config/console.php
@@ -30,15 +30,15 @@
             'useFileTransport' => false,//这句一定有，false发送邮件，true只是生成邮件在runtime文件夹下，不发邮 &#65533;
             'transport'        => [
                 'class'      => 'Swift_SmtpTransport',
-                'host'       => 'smtp.gmail.com',
-                'username'   => '<REDACTED_SMTP_USER>',
-                'password'   => '<REDACTED_SMTP_PASSWORD_ALT>',
+                'host'       => getenv('MORRISHK_SMTP_HOST') ?: 'smtp.gmail.com',
+                'username'   => getenv('MORRISHK_SMTP_USERNAME') ?: '',
+                'password'   => getenv('MORRISHK_SMTP_PASSWORD') ?: '',
                 'port'       => '465',
                 'encryption' => 'ssl',
             ],
             'messageConfig'    => [
                 'charset' => 'UTF-8',
-                'from'    => ['<REDACTED_SMTP_USER>' => 'admin']
+                'from'    => [getenv('MORRISHK_MAIL_FROM') ?: 'no-reply@example.invalid' => 'admin']
             ],
         ],
         'db' => $db,
```

#### 3.2.4 `models/User.php`

```diff
--- a/models/User.php
+++ b/models/User.php
@@ -18,18 +18,18 @@
             'username' => '<REDACTED_ACCOUNT>',
             'NickName' => 'Eric',
             'Avatar' => '',
-            'password' => '<REDACTED_PASSWORD>',
-            'authKey' => '<REDACTED_AUTH_KEY>',
-            'accessToken' => '<REDACTED_ACCESS_TOKEN>',
+            'password' => 'CHANGE_ME',
+            'authKey' => 'CHANGE_ME',
+            'accessToken' => 'CHANGE_ME',
         ],
         '101' => [
             'id' => '101',
             'username' => '<REDACTED_ACCOUNT_2>',
             'NickName' => 'Chimicron',
             'Avatar' => '',
-            'password' => '<REDACTED_PASSWORD>',
-            'authKey' => '<REDACTED_AUTH_KEY>',
-            'accessToken' => '<REDACTED_ACCESS_TOKEN>',
+            'password' => 'CHANGE_ME',
+            'authKey' => 'CHANGE_ME',
+            'accessToken' => 'CHANGE_ME',
         ],
     ];
 
```

#### 3.2.5 `snsii/Cf.php`

```diff
--- a/snsii/Cf.php
+++ b/snsii/Cf.php
@@ -20,12 +20,14 @@
 
 class Cf
 {
-    private $XAuthEmail = "<REDACTED_ACCOUNT>";
-    private $XAuthKey   = "<REDACTED_CF_API_KEY>";
+    private $XAuthEmail = null;
+    private $XAuthKey   = null;
 
     //初始化
-    public function __construct($XAuthEmail = "<REDACTED_ACCOUNT>", $XAuthKey = '<REDACTED_CF_API_KEY>')
+    public function __construct($XAuthEmail = null, $XAuthKey = null)
     {
+        $XAuthEmail = $XAuthEmail ?: getenv('MORRISHK_CLOUDFLARE_EMAIL');
+        $XAuthKey   = $XAuthKey ?: getenv('MORRISHK_CLOUDFLARE_API_KEY');
         if ($XAuthEmail) $this->XAuthEmail = $XAuthEmail;
         if ($XAuthKey) $this->XAuthKey = $XAuthKey;
 
@@ -147,7 +149,7 @@
     }
 
     //设置Https
-    //https://dash.cloudflare.com/api/v4/zones/<REDACTED_CF_ZONE_ID>/purge_cache/
+    //https://dash.cloudflare.com/api/v4/zones/CHANGE_ME_ZONE_ID/purge_cache/
     public function Cache($Did = '')
     {
         $CUrl = new Curl();
```

#### 3.2.6 `.gitignore`

```diff
--- a/.gitignore
+++ b/.gitignore
@@ -1,33 +1,44 @@
-# phpstorm project files
-.idea
-
-# netbeans project files
-nbproject
-
-# zend studio for eclipse project files
-.buildpath
-.project
-.settings
-
-# windows thumbnail cache
-Thumbs.db
-
-# composer vendor dir
-/vendor
-
-# composer itself is not needed
-composer.phar
-
-# Mac DS_Store Files
+# ---- dependencies (installed via composer / bower / npm) ----
+/vendor/
+/node_modules/
+/composer.phar
+/phpunit.phar
+
+# ---- local environment / secrets ----
+/.env
+.env.*
+!.env.example
+
+# ---- runtime and generated files ----
+/runtime/*
+!/runtime/.gitkeep
+/web/assets/*
+!/web/assets/.gitkeep
+*.log
+*.tmp
+*.cache
+*.swp
+*.swo
+
+# ---- uploaded / operational data (never commit) ----
+/web/upload/files/*
+!/web/upload/files/.gitkeep
+/web/upload/images/*
+!/web/upload/images/.gitkeep
+/web/upload/thumbs/*
+!/web/upload/thumbs/.htaccess
+/web/uploads/*
+!/web/uploads/.gitkeep
+/web/data/*
+/web/txt/
+
+# ---- IDE / OS ----
+.idea/
+nbproject/
+.vscode/
 .DS_Store
+Thumbs.db
+.directory
 
-# phpunit itself is not needed
-phpunit.phar
-# local phpunit config
-/phpunit.xml
-
-tests/_output/*
-tests/_support/_generated
-
-#vagrant folder
+# ---- misc ----
 /.vagrant
\ No newline at end of file
```

#### 3.2.7 `README.md`

```diff
--- a/README.md
+++ b/README.md
@@ -1,233 +1,102 @@
-<p align="center">
-    <a href="https://github.com/yiisoft" target="_blank">
-        <img src="https://avatars0.githubusercontent.com/u/993323" height="100px">
-    </a>
-    <h1 align="center">Yii 2 Basic Project Template</h1>
-    <br>
-</p>
+# Morrishk 站点应用（Yii2）
 
-Yii 2 Basic Project Template is a skeleton [Yii 2](http://www.yiiframework.com/) application best for
-rapidly creating small projects.
+Morrishk 多语种电子元器件独立站的应用代码基线。本仓库由现有生产应用的源代码归集而来，**只包含应用代码与工程说明，不包含数据库、生产上传文件、日志或任何凭据**。
 
-The template contains the basic features including user login/logout and a contact page.
-It includes all commonly used configurations that would allow you to focus on adding new
-features to your application.
+## 1. 项目用途
 
-[![Latest Stable Version](https://img.shields.io/packagist/v/yiisoft/yii2-app-basic.svg)](https://packagist.org/packages/yiisoft/yii2-app-basic)
-[![Total Downloads](https://img.shields.io/packagist/dt/yiisoft/yii2-app-basic.svg)](https://packagist.org/packages/yiisoft/yii2-app-basic)
-[![build](https://github.com/yiisoft/yii2-app-basic/workflows/build/badge.svg)](https://github.com/yiisoft/yii2-app-basic/actions?query=workflow%3Abuild)
+- 旧站前台：产品/分类/搜索/详情/品牌页、询价车、内容页、多语种域名入口。
+- 后台：`modules/ejadmin` 管理模块（商品、分类、新闻、帮助、信息页等）。
+- 控制台命令：缓存/静态页生成、日志、供应商等批处理。
 
-DIRECTORY STRUCTURE
--------------------
+## 2. 技术栈
 
-      assets/             contains assets definition
-      commands/           contains console commands (controllers)
-      config/             contains application configurations
-      controllers/        contains Web controller classes
-      mail/               contains view files for e-mails
-      models/             contains model classes
-      runtime/            contains files generated during runtime
-      tests/              contains various tests for the basic application
-      vendor/             contains dependent 3rd-party packages
-      views/              contains view files for the Web application
-      web/                contains the entry script and Web resources
+| 层 | 现状 |
+|---|---|
+| 框架 | Yii 2 Basic（单应用，`composer.json` 声明 `yiisoft/yii2 ~2.0.14`） |
+| PHP | `composer.json` 要求 `>=5.6.0`；生产环境记录为 PHP 7.4.33（nginx + PHP-FPM，宝塔面板） |
+| 数据库 | MySQL 5.6.50，库 `morris`，表前缀 `snsii_`（MyISAM，utf8mb3） |
+| 缓存 | Yii `FileCache`（`config/web.php`） |
+| 邮件 | `yiisoft/yii2-swiftmailer`（SMTP） |
+| 前端资源 | Bootstrap 4（`bsVersion = 4.x`），静态资源位于 `web/css`、`web/js`、`web/image`、`web/fonts`；`assets/AppAsset.php` 定义资源包 |
+| 依赖源 | `asset-packagist.org`，bower 资源安装到 `vendor/bower-asset` |
 
+版本以 `composer.json` / `composer.lock` 为准；本仓库不安装、不升级依赖。
 
+## 3. 目录结构（实际存在）
 
-REQUIREMENTS
-------------
-
-The minimum requirement by this project template that your Web server supports PHP 5.6.0.
-
-
-INSTALLATION
-------------
-
-### Install via Composer
-
-If you do not have [Composer](http://getcomposer.org/), you may install it by following the instructions
-at [getcomposer.org](http://getcomposer.org/doc/00-intro.md#installation-nix).
-
-You can then install this project template using the following command:
-
-~~~
-composer create-project --prefer-dist yiisoft/yii2-app-basic basic
-~~~
-
-Now you should be able to access the application through the following URL, assuming `basic` is the directory
-directly under the Web root.
-
-~~~
-http://localhost/basic/web/
-~~~
-
-### Install from an Archive File
-
-Extract the archive file downloaded from [yiiframework.com](http://www.yiiframework.com/download/) to
-a directory named `basic` that is directly under the Web root.
-
-Set cookie validation key in `config/web.php` file to some random secret string:
-
-```php
-'request' => [
-    // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
-    'cookieValidationKey' => '<secret random string goes here>',
-],
 ```
-
-You can then access the application through the following URL:
-
-~~~
-http://localhost/basic/web/
-~~~
-
-
-### Install with Docker
-
-Update your vendor packages
-
-    docker-compose run --rm php composer update --prefer-dist
-    
-Run the installation triggers (creating cookie validation code)
-
-    docker-compose run --rm php composer install    
-    
-Start the container
-
-    docker-compose up -d
-    
-You can then access the application through the following URL:
-
-    http://127.0.0.1:8000
-
-**NOTES:** 
-- Minimum required Docker engine version `17.04` for development (see [Performance tuning for volume mounts](https://docs.docker.com/docker-for-mac/osxfs-caching/))
-- The default configuration uses a host-volume in your home directory `.docker-composer` for composer caches
-
-
-CONFIGURATION
--------------
-
-### Database
-
-Edit the file `config/db.php` with real data, for example:
-
-```php
-return [
-    'class' => 'yii\db\Connection',
-    'dsn' => 'mysql:host=localhost;dbname=yii2basic',
-    'username' => 'root',
-    'password' => '1234',
-    'charset' => 'utf8',
-];
+config/        应用配置（web / console / params / db / i18n）
+controllers/   前台控制器
+models/        模型与表单
+modules/ejadmin/  后台模块（控制器、模型、视图）
+views/         前台视图
+commands/      控制台控制器与公共基类
+service/       服务类（MailService）
+snsii/         项目内部辅助库
+messages/      多语言词条（按语言分目录）
+mail/          邮件布局
+assets/        AppAsset
+web/           Web 根目录（入口、静态资源、robots.txt）
 ```
 
-**NOTES:**
-- Yii won't create the database for you, this has to be done manually before you can access it.
-- Check and edit the other files in the `config/` directory to customize your application as required.
-- Refer to the README in the `tests` directory for information specific to basic application tests.
-
+## 4. 本地开发环境准备
 
-TESTING
--------
-
-Tests are located in `tests` directory. They are developed with [Codeception PHP Testing Framework](http://codeception.com/).
-By default, there are 3 test suites:
-
-- `unit`
-- `functional`
-- `acceptance`
-
-Tests can be executed by running
+1. 安装 PHP 7.4（生产记录版本）及 `composer`、MySQL 5.6+。
+2. 在仓库根目录安装依赖：
 
+```bash
+composer install
 ```
-vendor/bin/codecept run
-```
-
-The command above will execute unit and functional tests. Unit tests are testing the system components, while functional
-tests are for testing user interaction. Acceptance tests are disabled by default as they require additional setup since
-they perform testing in real browser. 
 
+> 本机未执行上述命令（无 `vendor/`，本轮不安装依赖），因此该命令为**待验证**。
 
-### Running  acceptance tests
+3. 检查 PHP 扩展是否满足要求：
 
-To execute acceptance tests do the following:  
-
-1. Rename `tests/acceptance.suite.yml.example` to `tests/acceptance.suite.yml` to enable suite configuration
-
-2. Replace `codeception/base` package in `composer.json` with `codeception/codeception` to install full-featured
-   version of Codeception
-
-3. Update dependencies with Composer 
-
-    ```
-    composer update  
-    ```
-
-4. Download [Selenium Server](http://www.seleniumhq.org/download/) and launch it:
-
-    ```
-    java -jar ~/selenium-server-standalone-x.xx.x.jar
-    ```
+```bash
+php requirements.php
+```
 
-    In case of using Selenium Server 3.0 with Firefox browser since v48 or Google Chrome since v53 you must download [GeckoDriver](https://github.com/mozilla/geckodriver/releases) or [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/downloads) and launch Selenium with it:
+> 未执行（本机未确认可用 PHP CLI 版本），结果 **NOT RUN**。
 
-    ```
-    # for Firefox
-    java -jar -Dwebdriver.gecko.driver=~/geckodriver ~/selenium-server-standalone-3.xx.x.jar
-    
-    # for Google Chrome
-    java -jar -Dwebdriver.chrome.driver=~/chromedriver ~/selenium-server-standalone-3.xx.x.jar
-    ``` 
-    
-    As an alternative way you can use already configured Docker container with older versions of Selenium and Firefox:
-    
-    ```
-    docker run --net=host selenium/standalone-firefox:2.53.0
-    ```
+4. 准备配置环境变量（见第 5 节）。
+5. 将 Web 根指向 `web/`，入口为 `web/index.php`。
 
-5. (Optional) Create `yii2basic_test` database and update it by applying migrations if you have them.
+## 5. 配置文件准备方式
 
-   ```
-   tests/bin/yii migrate
-   ```
+`config/db.php`、`config/web.php`、`config/console.php`、`snsii/Cf.php` 中的凭据已改为 `getenv()` 读取，变量清单见 `.env.example`。`models/User.php` 的静态测试身份已替换为 `CHANGE_ME` 占位符（静态属性不能调用函数，若需使用该模型请自行改为安全来源）。
 
-   The database configuration can be found at `config/test_db.php`.
+**注意**：本项目没有内置 `.env` 加载器。`.env.example` 只是变量清单；实际运行时必须通过 Web Server / PHP-FPM 环境变量或 CLI 导出注入，例如：
 
+```bash
+export MORRISHK_DB_DSN='mysql:host=localhost;dbname=morris'
+export MORRISHK_DB_USERNAME='...'
+export MORRISHK_DB_PASSWORD='...'
+export MORRISHK_COOKIE_VALIDATION_KEY='...'
+```
 
-6. Start web server:
+缺少 `MORRISHK_COOKIE_VALIDATION_KEY` 时 Cookie 校验相关功能不可用；缺少数据库变量时连接会失败。生产凭据不在本仓库内，轮换与外部化待项目负责人决策。
 
-    ```
-    tests/bin/yii serve
-    ```
+## 6. 应用入口
 
-7. Now you can run all available tests
+- Web：`web/index.php`（Yii2 应用入口；当前源码含 `YII_DEBUG=true`、`YII_ENV=dev`，属已登记风险，本基线未改动）。
+- Console：仓库根目录 `yii`（`php yii <route>`）。
 
-   ```
-   # run all available tests
-   vendor/bin/codecept run
+## 7. 测试
 
-   # run acceptance tests
-   vendor/bin/codecept run acceptance
+`codeception.yml` 存在，但其指向的 `tests/` 目录不在源目录中，也没有可确认的测试命令。本轮**未执行任何测试**，相关项均为 **NOT RUN**。
 
-   # run only unit and functional tests
-   vendor/bin/codecept run unit,functional
-   ```
+## 8. 数据库
 
-### Code coverage support
+仓库内**没有** migrations、schema 或初始化脚本；数据库结构以实际 MySQL 实例为准。现有结构快照的说明见 `docs/database/README.md`。
 
-By default, code coverage is disabled in `codeception.yml` configuration file, you should uncomment needed rows to be able
-to collect code coverage. You can run your tests and collect coverage with the following command:
+## 9. 部署
 
-```
-#collect coverage for all tests
-vendor/bin/codecept run --coverage --coverage-html --coverage-xml
+部署环境、目录、PHP 版本与回滚材料的核实状态见 `docs/deployment/README.md`。本轮未部署、未修改服务器。
 
-#collect coverage only for unit tests
-vendor/bin/codecept run unit --coverage --coverage-html --coverage-xml
-
-#collect coverage for unit and functional tests
-vendor/bin/codecept run functional,unit --coverage --coverage-html --coverage-xml
-```
+## 10. 当前未验证事项
 
-You can see code coverage output under the `tests/_output` directory.
+- `composer install` 是否能在 PHP 7.4 下完整解析（未执行）。
+- 应用是否能在本地启动（无依赖、无数据库）。
+- 线上部署目录与当前提交的对应关系（无服务器访问权限）。
+- 测试套件是否可运行（`tests/` 缺失）。
+- 既有硬编码凭据是否已发生外部泄露（仅能确认源码内存在，历史不可考）。
\ No newline at end of file
```


---

## 4. `.env.example` 变量清单与代码读取位置

`.env.example` 仅含变量名、说明和示例占位值，**不含任何真实凭据**。共 10 个变量：

| 变量 | 读取位置 | 缺省回退 |
|---|---|---|
| `MORRISHK_DB_DSN` | `config/db.php:5` | `mysql:host=localhost;dbname=morris` |
| `MORRISHK_DB_USERNAME` | `config/db.php:6` | 空字符串 |
| `MORRISHK_DB_PASSWORD` | `config/db.php:7` | 空字符串 |
| `MORRISHK_COOKIE_VALIDATION_KEY` | `config/web.php:18` | 空字符串 |
| `MORRISHK_SMTP_HOST` | `config/web.php:54`、`config/console.php:33` | `smtp.gmail.com` |
| `MORRISHK_SMTP_USERNAME` | `config/web.php:55`、`config/console.php:34` | 空字符串 |
| `MORRISHK_SMTP_PASSWORD` | `config/web.php:56`、`config/console.php:35` | 空字符串 |
| `MORRISHK_MAIL_FROM` | `config/web.php:62`、`config/console.php:41` | `no-reply@example.invalid`（web）/ `no-reply@example.invalid`（console） |
| `MORRISHK_CLOUDFLARE_EMAIL` | `snsii/Cf.php:29` | `null` |
| `MORRISHK_CLOUDFLARE_API_KEY` | `snsii/Cf.php:30` | `null` |

读取方式均为 `getenv('...') ?: <fallback>`。应用启动代码**没有**加载 `.env` 文件的逻辑（`composer.lock` 中的 dotenv 字样来自第三方包依赖声明，不是本应用的加载器），因此变量必须由 PHP-FPM / CLI 环境注入。

复现命令：

```bash
git grep -n -o "getenv('MORRISHK_[A-Z_]*')" 1d66acb -- .
```

---

## 5. `models/User.php` 变更专项说明

### 5.1 变更内容

仅静态数组 `$users` 中两个条目的 `password`、`authKey`、`accessToken` 三个字段由原字面值改为 `CHANGE_ME`（共 6 行）。`username`、`NickName`、`Avatar`、`id` 未改；所有方法体未改。完整差异见 3.2.4。

### 5.2 认证逻辑未变的代码证据

`models/User.php` 仍完整实现 `yii\web\IdentityInterface`，方法位置与内容：

| 方法 | 行号 | 说明 |
|---|---:|---|
| `findIdentity($id)` | 40 | 从静态数组按 id 返回身份对象 |
| `findIdentityByAccessToken($token, $type)` | 48 | 遍历静态数组比对 `accessToken` |
| `findByUsername($username)` | 65 | 遍历静态数组比对 `username` |
| `getId()` | 79 | 返回 `$this->id` |
| `getAuthKey()` | 87 | 返回 `$this->authKey` |
| `validateAuthKey($authKey)` | 95 | `$this->authKey === $authKey` |
| `validatePassword($password)` | 106 | `$this->password === $password` |

以上方法在 diff 中均未出现，说明认证判定代码未发生变化。

### 5.3 该模型是否在实际登录路径中

**不在。**

1. `config/web.php:29` 指定实际身份类为：`'identityClass' => 'app\modules\ejadmin\models\SnSiiManage'`。
2. 登录入口 `controllers/SiteController.php:175` `actionLogin()`，第 185 行实例化 `LoginForm`，第 186 行调用 `$model->login()`。
3. `models/LoginForm.php:74` `getUser()` 中：
   - 第 77 行为注释：`//$this->_user = User::findByUsername($this->username);`
   - 第 78 行为生效代码：`$this->_user = SnSiiManage::findByUsername($this->username);`
4. 全仓库对 `app\models\User` 的引用只有上述注释一行；无 `use app\models\User`，无 `User::` 其他调用，无 `SignupForm`。
5. 未配置 `HttpBearerAuth` / `HttpBasicAuth` / `authenticator`，`findIdentityByAccessToken` 无 HTTP 认证入口。

结论：`models/User.php` 是 Yii2 Basic 模板遗留的静态身份样例，修改其凭据不影响后台登录、Cookie 登录或权限判断。

### 5.4 初始管理员账号

- 仓库内**没有** migrations、seed、安装脚本或创建管理员的代码；静态 `$users` 不是数据库种子。
- 真实管理员来自数据库表 `{{%manage}}`（`modules/ejadmin/models/SnSiiManage.php:27`），通过 `findByUsername()`（第 104 行）按 `UserName` 或 `Email` 且 `Status = 1` 查询。
- 密码校验使用 Yii 安全组件：`Yii::$app->security->validatePassword($password, $this->PassWord)`（第 147 行），即哈希校验，不是明文比较。
- 本轮未连接数据库，`snsii_manage` 中的实际账号清单为 **UNVERIFIED**。

### 5.5 安全性影响

- 静态样例身份在提交后不再持有可用密码；即使有人重新启用第 77 行注释，也必须输入字面量 `CHANGE_ME` 才能通过，等于不可用。
- 由于该路径当前不可达，登录验证逻辑、后台账号与会话认证均未发生行为变化。

---

## 6. 凭据外置的扫描范围、命令与结果

### 6.1 范围

- 扫描对象：`1d66acb` 的 Git 索引内容（620 个已跟踪文件），不含未跟踪来源文件。
- 覆盖 5 处外置：`config/db.php`、`config/web.php`、`config/console.php`、`models/User.php`、`snsii/Cf.php`。
- 扫描过程只输出命中文件数/行号，**不输出凭据值**；已知值从来源文件对应行读取后直接传入 `git grep`，未打印、未写入日志文件。

### 6.2 命令

```bash
# (1) 已知凭据字面值：逐个扫描整个索引
git grep --cached -F -l -e '<VALUE>'

# (2) 通用密钥模式
git grep --cached -l -E 'AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|ghp_[0-9A-Za-z]{36}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|sk-[0-9A-Za-z]{32,}'

# (3) 仍存在的“键=字面值”赋值（人工复核是否为占位符）
git grep -n -E "(password|passwd|PassWord|authKey|accessToken|cookieValidationKey|XAuthKey|XAuthEmail|api_key|apikey|secret)[\"']?[[:space:]]*(=>|=)[[:space:]]*[\"'][^\"']+[\"']" -- ':!messages'

# (4) 敏感文件名
git ls-tree -r --name-only 1d66acb | grep -Ei '(\.sql$|\.dump$|\.bak$|\.pem$|\.key$|\.p12$|\.pfx$|(^|/)\.env$|credential|secret)'
```

### 6.3 结果

| 来源位置 | 字段 | 索引命中文件数 |
|---|---|---:|
| `config/db.php:6` | db username（原值同时是品牌词） | 0（精确赋值串）；裸词形式 149 个文件，属品牌名误报 |
| `config/db.php:7` | db password | 0 |
| `config/web.php:18` | cookieValidationKey | 0 |
| `config/web.php:55` | smtp username | 0 |
| `config/web.php:56` | smtp password | 0 |
| `config/web.php:72` | smtp password（注释块） | 0 |
| `config/web.php:88` | smtp password（注释块，另一值） | 0 |
| `config/console.php:34` | smtp username | 0 |
| `config/console.php:35` | smtp password | 0 |
| `models/User.php:21-23` | user100 password/authKey/accessToken | 0 / 0 / 0 |
| `models/User.php:30-32` | user101 password/authKey/accessToken | 0 / 0 / 0 |
| `snsii/Cf.php:23` | Cloudflare 邮箱 | 1（同字符串仍作为 `models/User.php` 的 username 保留） |
| `snsii/Cf.php:24` | Cloudflare API key | 0 |
| `snsii/Cf.php:150` | Cloudflare zone ID | 0 |

| 扫描项 | 结果 |
|---|---|
| 通用密钥模式 | 0 命中 |
| 敏感文件名 | 0 命中 |
| 仍存在的“键=字面值” | 9 行，全部为占位符或标签（见下） |
| 被排除目录的跟踪情况 | 仅 `runtime/.gitkeep`、`web/upload/files/.gitkeep`、`web/upload/images/.gitkeep`、`web/upload/thumbs/.htaccess`、`web/uploads/.gitkeep`；无 `web/data/`、`web/txt/`、`vendor/` 内容 |

9 行“键=字面值”明细（均非凭据）：

| 位置 | 内容性质 |
|---|---|
| `config/web.php:72` | `CHANGE_ME_SMTP_PASSWORD` 占位符 |
| `config/web.php:88` | `CHANGE_ME_SMTP_PASSWORD_ALT` 占位符 |
| `models/User.php:21,22,23,30,31,32` | 6 个 `CHANGE_ME` 占位符 |
| `modules/ejadmin/models/SnSiiManage.php:41` | 属性标签 `'PassWord' => '密码'`，非凭据 |

### 6.4 保留的账号标识（非密码，需 Reviewer 知悉）

- `models/User.php:18` 与 `:27` 的两个 `username` 值未修改（本次只改凭据字段）。
- `config/web.php:87` 注释块中保留一个备用 SMTP 用户名（未启用）。
- 上述均为账号标识而非密码/密钥；仓库内不存在对应明文口令。

---

## 7. Codeup 当前状态（只读输出）

```text
$ git rev-parse HEAD
cdb9c044dd2f2fc86967dc6738341b11bbeba7f5

$ git rev-parse 'HEAD^{tree}'
b0e28eb0d9f04821bcfa8520a8f3b712f828a6b6

$ git ls-remote origin refs/heads/main
cdb9c044dd2f2fc86967dc6738341b11bbeba7f5	refs/heads/main

$ git status --short --branch
## main...origin/main

$ git log --oneline -3
cdb9c04 docs: add P0-01 baseline report
1d66acb chore: establish Morrishk application baseline
```

- 本地 HEAD、`refs/heads/main`、远端 `refs/heads/main` 三者一致。
- 工作区无修改、无未跟踪文件（采集后最终状态）。
- 基线提交 `1d66acb` 的 tree 为 `f3acd46f2ba057c9f6f25aa0e59b9fdeb3ed9119`；当前 HEAD 的 tree 为 `b0e28eb...`，差异仅来自新增的报告文件。

---

## 8. 边界与合规声明

1. 本材料为**证据补充**：未修改应用代码，未新增 Codeup 提交，未推送，未改动远端。
2. 未修改原 P0-01 报告 `MORRISHK_P0_01_REPOSITORY_AND_DEPLOYMENT_BASELINE.md`。
3. 未修改 Discovery v1.0.1、Session A v1.16.1、Session B `090cae9` 材料。
4. 未连接生产服务器或数据库，未执行部署、迁移、备份。
5. 未输出任何密码、API key、Cookie 密钥、Zone ID 或私钥；diff 中的凭据以 `<REDACTED_*>` 替代。
6. 本文件不构成验收结论；等待 Reviewer 独立复核。
