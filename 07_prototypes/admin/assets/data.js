/* ============================================================================
   Morrishk Intelligence — Admin Prototype Mock Data
   全部为 Demo 数据，不对应任何真实商品、库存、价格、询盘或账号。
   数据仅存在于浏览器内存，刷新即重置；不发起网络请求，不写库。
   ========================================================================= */
(function () {
  'use strict';

  var D = {};

  /* ------------------------------------------------------------------ 元信息 */
  D.meta = {
    product: 'Morrishk Intelligence',
    version: 'v1.0-admin-prototype',
    date: '2026-11-16',
    scope: '统一管理运营中心 HTML 原型',
    note: '全部业务数据为 Demo；DS Bit 为独立引擎，本原型仅设计其数据管理与使用入口。'
  };

  /* ------------------------------------------------------------------ 商品 */
  D.products = [
    { mpn: 'MCF8315A', brand: 'Texas Instruments', name: 'Three-Phase Sensorless-FOC BLDC Motor Driver', category: 'Motor Drivers', stock: 'In Stock', qty: 12480, warehouse: 'HK', lead: '3–5 days', datasheet: 'v2.1', seo: 'Optimized', content: 'Published', updated: '2026-11-16 09:42', price: 'Request Quote' },
    { mpn: 'STM32F103C8T6', brand: 'STMicroelectronics', name: 'ARM Cortex-M3 MCU, 64KB Flash, LQFP-48', category: 'Microcontrollers', stock: 'Low Stock', qty: 320, warehouse: 'HK', lead: '7–10 days', datasheet: 'v9.0', seo: 'Needs Review', content: 'Draft', updated: '2026-11-16 09:18', price: 'Request Quote' },
    { mpn: 'LM317T', brand: 'Texas Instruments', name: '1.5A Adjustable Linear Voltage Regulator, TO-220', category: 'Power Management', stock: 'In Stock', qty: 8650, warehouse: 'HK', lead: '3–5 days', datasheet: 'v6.0', seo: 'Optimized', content: 'Published', updated: '2026-11-15 17:26', price: 'Request Quote' },
    { mpn: 'NE555DR', brand: 'Texas Instruments', name: 'Precision Timer, SOIC-8', category: 'Analog', stock: 'Out of Stock', qty: 0, warehouse: 'HK', lead: '14–21 days', datasheet: 'v4.0', seo: 'Missing Meta', content: 'Published', updated: '2026-11-15 16:03', price: 'Request Quote' },
    { mpn: 'IRF540NPBF', brand: 'Infineon', name: 'N-Channel MOSFET, 100V, 33A, TO-220', category: 'Discrete', stock: 'In Stock', qty: 4210, warehouse: 'SZ', lead: '5–7 days', datasheet: 'v3.0', seo: 'Optimized', content: 'Published', updated: '2026-11-15 14:52', price: 'Request Quote' },
    { mpn: 'ESP32-WROOM-32E', brand: 'Espressif', name: 'Wi-Fi + Bluetooth Module, 4MB Flash', category: 'Wireless', stock: 'Low Stock', qty: 180, warehouse: 'SZ', lead: '10–14 days', datasheet: 'v1.8', seo: 'Needs Review', content: 'Draft', updated: '2026-11-14 11:38', price: 'Request Quote' },
    { mpn: '1N4148W', brand: 'Vishay', name: 'Fast Switching Diode, SOD-123', category: 'Discrete', stock: 'In Stock', qty: 120000, warehouse: 'HK', lead: '3–5 days', datasheet: 'v2.0', seo: 'Optimized', content: 'Published', updated: '2026-11-14 10:05', price: 'Request Quote' },
    { mpn: 'TLP185(GB)', brand: 'Toshiba', name: 'Photocoupler, SOP-4, CTR 50–600%', category: 'Isolation', stock: 'End of Life', qty: 0, warehouse: 'HK', lead: '—', datasheet: 'v1.2', seo: 'Deprecated', content: 'Published', updated: '2026-11-13 15:44', price: 'Request Quote' },
    { mpn: 'ACS712ELCTR-05B-T', brand: 'Allegro', name: 'Hall-Effect Current Sensor, ±5A, SOIC-8', category: 'Sensors', stock: 'In Stock', qty: 2380, warehouse: 'HK', lead: '5–7 days', datasheet: 'v1.5', seo: 'Optimized', content: 'Published', updated: '2026-11-13 09:20', price: 'Request Quote' },
    { mpn: 'MAX232ECP', brand: 'Maxim', name: 'Dual RS-232 Transceiver, DIP-16', category: 'Interface', stock: 'Low Stock', qty: 95, warehouse: 'SZ', lead: '10–14 days', datasheet: 'v5.0', seo: 'Needs Review', content: 'Draft', updated: '2026-11-12 16:12', price: 'Request Quote' },
    { mpn: 'BAV99', brand: 'onsemi', name: 'Dual Switching Diode, SOT-23', category: 'Discrete', stock: 'In Stock', qty: 54000, warehouse: 'HK', lead: '3–5 days', datasheet: 'v2.2', seo: 'Optimized', content: 'Published', updated: '2026-11-12 13:06', price: 'Request Quote' },
    { mpn: 'GRM188R71H104KA93D', brand: 'Murata', name: '0.1µF 50V X7R 0603 MLCC', category: 'Passives', stock: 'In Stock', qty: 240000, warehouse: 'HK', lead: '3–5 days', datasheet: 'v1.4', seo: 'Optimized', content: 'Published', updated: '2026-11-11 17:31', price: 'Request Quote' }
  ];

  /* 历史验证快照：已发布商品保留其发布时的三层闸门结果；当前 Demo 会话不重新运行解析。 */
  D.products.forEach(function (p, i) {
    if (p.content !== 'Published') { p.verifySnapshot = null; return; }
    var d = p.updated.slice(0, 10).replace(/-/g, '');
    var seq = (i + 1 < 10 ? '0' : '') + (i + 1);
    p.verifySnapshot = {
      id: 'VS-' + d + '-' + seq,
      run: 'PR-' + d + '-' + seq + '-01',
      pipeline: 'PASS',
      contentVersion: 'v2',
      contentApproved: true,
      releaseApproved: true,
      batch: 'B-' + d + '-01'
    };
  });

  D.brands = [
    { name: 'Texas Instruments', products: 3120, category: 'IC / Analog / Power', status: 'Active', updated: '2026-11-16' },
    { name: 'STMicroelectronics', products: 1840, category: 'MCU / Power', status: 'Active', updated: '2026-11-16' },
    { name: 'Infineon', products: 960, category: 'Power / Discrete', status: 'Active', updated: '2026-11-15' },
    { name: 'Vishay', products: 2210, category: 'Discrete / Passives', status: 'Active', updated: '2026-11-15' },
    { name: 'Murata', products: 4100, category: 'Passives', status: 'Active', updated: '2026-11-14' },
    { name: 'Espressif', products: 320, category: 'Wireless', status: 'Active', updated: '2026-11-14' },
    { name: 'Toshiba', products: 680, category: 'Isolation / Discrete', status: 'Review', updated: '2026-11-13' },
    { name: 'onsemi', products: 1520, category: 'Discrete / Sensors', status: 'Active', updated: '2026-11-12' }
  ];

  D.categories = [
    { name: 'Integrated Circuits (ICs)', parent: '—', products: 4820, attrs: 18, status: 'Active' },
    { name: 'Motor Drivers', parent: 'Integrated Circuits (ICs)', products: 312, attrs: 12, status: 'Active' },
    { name: 'Microcontrollers', parent: 'Integrated Circuits (ICs)', products: 1240, attrs: 14, status: 'Active' },
    { name: 'Power Management', parent: 'Integrated Circuits (ICs)', products: 1680, attrs: 16, status: 'Active' },
    { name: 'Analog', parent: 'Integrated Circuits (ICs)', products: 980, attrs: 11, status: 'Active' },
    { name: 'Discrete', parent: '—', products: 2360, attrs: 9, status: 'Active' },
    { name: 'Wireless', parent: '—', products: 420, attrs: 8, status: 'Active' },
    { name: 'Passives', parent: '—', products: 4100, attrs: 7, status: 'Active' }
  ];

  D.categoryAttrs = [
    { name: 'Supply Voltage', unit: 'V', type: 'range', required: true, source: 'Ds Bit' },
    { name: 'Output Current', unit: 'A', type: 'range', required: true, source: 'Ds Bit' },
    { name: 'Package', unit: '—', type: 'enum', required: true, source: 'Ds Bit' },
    { name: 'Operating Temperature', unit: '°C', type: 'range', required: true, source: 'Ds Bit' },
    { name: 'Interface', unit: '—', type: 'enum', required: false, source: 'Manual' },
    { name: 'RoHS', unit: '—', type: 'boolean', required: true, source: 'Manual' }
  ];

  /* ------------------------------------------------------------------ Datasheet / 参数 */
  D.documents = [
    { id: 'DS-1042', file: 'MCF8315A_datasheet_v2.1.pdf', mpn: 'MCF8315A', run: 'PR-20261115-1042-01', type: 'Datasheet', subject: 'MCF8315A three-phase sensorless-FOC BLDC motor driver', pages: 42, size: '3.8 MB', hash: '9f2c7a1b4e8d6c03a5f1', version: 'v2.1', status: 'Parsed', params: 186, issues: 3, applicability: 'Direct', uploaded: '2026-11-15 10:22' },
    { id: 'DS-1041', file: 'STM32F103x8_datasheet_v9.0.pdf', mpn: 'STM32F103C8T6', run: 'PR-20261114-1041-01', type: 'Datasheet', subject: 'STM32F103x8/xB medium-density MCU', pages: 118, size: '9.4 MB', hash: '3a1d9c6f2b7e8a04c1d2', version: 'v9.0', status: 'Parsed', params: 412, issues: 11, applicability: 'Direct', uploaded: '2026-11-14 16:08' },
    { id: 'DS-1040', file: 'LM317_datasheet_v6.0.pdf', mpn: 'LM317T', run: 'PR-20261114-1040-01', type: 'Datasheet', subject: 'LM317 adjustable three-terminal regulator', pages: 28, size: '1.9 MB', hash: 'c7e4b2a9d1f6e8035b9c', version: 'v6.0', status: 'Parsed', params: 94, issues: 0, applicability: 'Direct', uploaded: '2026-11-14 09:41' },
    { id: 'DS-1039', file: 'IRF540N_datasheet_v3.0.pdf', mpn: 'IRF540NPBF', run: 'PR-20261113-1039-01', type: 'Datasheet', subject: 'IRF540N N-channel power MOSFET', pages: 12, size: '0.8 MB', hash: '5b8f0d3c6a2e7f914d08', version: 'v3.0', status: 'Parsed', params: 61, issues: 2, applicability: 'Direct', uploaded: '2026-11-13 14:17' },
    { id: 'DS-1038', file: 'ESP32-WROOM-32E_v1.8.pdf', mpn: 'ESP32-WROOM-32E', run: 'PR-20261116-1038-01', type: 'Datasheet', subject: 'ESP32-WROOM-32E Wi-Fi + Bluetooth module', pages: 64, size: '5.1 MB', hash: 'e2a6c8b1f4d0973a5e6c', version: 'v1.8', status: 'Parsing', params: 0, issues: 0, applicability: 'Pending', uploaded: '2026-11-16 08:55' },
    { id: 'DS-1037', file: 'TLP185_datasheet_v1.2.pdf', mpn: 'TLP185(GB)', run: 'PR-20261112-1037-01', type: 'Datasheet', subject: 'TLP185 photocoupler', pages: 16, size: '1.1 MB', hash: '7d3b9f5a2c8e4d01b6f7', version: 'v1.2', status: 'Parsed', params: 58, issues: 7, applicability: 'Direct', uploaded: '2026-11-12 11:03' },
    { id: 'DS-1036', file: 'ACS712_datasheet_v1.5.pdf', mpn: 'ACS712ELCTR-05B-T', run: 'PR-20261111-1036-01', type: 'Datasheet', subject: 'ACS712 Hall-effect linear current sensor', pages: 22, size: '1.5 MB', hash: 'a4c1e7b9d3f5028c6b1e', version: 'v1.5', status: 'Parsed', params: 73, issues: 1, applicability: 'Direct', uploaded: '2026-11-11 15:48' },
    { id: 'DS-1035', file: 'MAX232_datasheet_v5.0.pdf', mpn: 'MAX232ECP', run: 'PR-20261110-1035-01', type: 'Datasheet', subject: 'MAX232 dual RS-232 transceiver', pages: 18, size: '1.2 MB', hash: 'f8d2b6a4c9e1370f5a2d', version: 'v5.0', status: 'Failed', params: 0, issues: 0, applicability: 'Pending', uploaded: '2026-11-10 09:12' },
    { id: 'DS-1034', file: 'GRM188R71H104KA93D_v1.4.pdf', mpn: 'GRM188R71H104KA93D', run: 'PR-20261109-1034-01', type: 'Datasheet', subject: 'GRM188R71H104KA93D 0.1µF 50V X7R MLCC', pages: 9, size: '0.6 MB', hash: 'b1e9d4a7f3c268059e4b', version: 'v1.4', status: 'Parsed', params: 44, issues: 0, applicability: 'Direct', uploaded: '2026-11-09 13:30' },
    { id: 'DS-1033', file: 'MCF831x_family_selection_guide_v1.0.pdf', mpn: 'MCF8315A', run: 'PR-20261108-1033-01', type: 'Selection Guide', subject: 'MCF831x family (MCF8315A / MCF8316A)', pages: 24, size: '2.2 MB', hash: 'c0d5e8a2b7f4913d6e2a', version: 'v1.0', status: 'Parsed', params: 12, issues: 1, applicability: 'Family match', applicabilityNote: '系列文档，仅作选型背景；不绑定参数证据', uploaded: '2026-11-08 16:40' }
  ];

  /* 参数记录字段对齐 Ds Bit 数据模型（DocumentId / ParseRunId / Raw* / Normalized* / ValueKind / Conditions / 位置 / ReviewStatus） */
  D.params = [
    { mpn: 'MCF8315A', doc: 'DS-1042', run: 'PR-20261115-1042-01', docType: 'Datasheet', docSubject: 'MCF8315A three-phase sensorless-FOC BLDC motor driver',
      name: 'Supply Voltage', rawLabel: 'VVM', rawValue: '4.5 V to 35 V', value: '4.5–35', unit: 'V', kind: 'range', conditions: 'TA = 25°C, operating range',
      page: 8, table: 'T-08-02', row: 'R-04', bbox: '[312, 486, 528, 502]', confidence: 0.99, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'VVM 4.5 V to 35 V (operating range)', hash: '9f2c7a1b4e8d6c03a5f1', updated: '2026-11-15 10:40' },
    { mpn: 'MCF8315A', doc: 'DS-1042', run: 'PR-20261115-1042-01', docType: 'Datasheet', docSubject: 'MCF8315A three-phase sensorless-FOC BLDC motor driver',
      name: 'Peak Output Current', rawLabel: 'IPEAK', rawValue: '8 A (1 ms pulse)', value: '8', unit: 'A', kind: 'max', conditions: '1 ms pulse, VVM = 24 V',
      page: 9, table: 'T-09-01', row: 'R-02', bbox: '[298, 512, 501, 528]', confidence: 0.97, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'Peak output current, 1 ms pulse: 8 A', hash: '9f2c7a1b4e8d6c03a5f1', updated: '2026-11-15 10:41' },
    { mpn: 'MCF8315A', doc: 'DS-1042', run: 'PR-20261115-1042-01', docType: 'Datasheet', docSubject: 'MCF8315A three-phase sensorless-FOC BLDC motor driver',
      name: 'RDS(on) (HS + LS)', rawLabel: 'RDS(on)', rawValue: '95 mΩ typ. (HS + LS)', value: '95', unit: 'mΩ', kind: 'typ', conditions: 'TA = 25°C, VVM = 24 V',
      page: 12, table: 'T-12-03', row: 'R-06', bbox: '[344, 604, 566, 620]', confidence: 0.82, status: 'Needs Review', applicability: 'Direct · MPN 匹配',
      snippet: 'Total RDS(on) at TA = 25°C, typical 95 mΩ', hash: '9f2c7a1b4e8d6c03a5f1', updated: '2026-11-15 10:43' },
    { mpn: 'MCF8315A', doc: 'DS-1042', run: 'PR-20261115-1042-01', docType: 'Datasheet', docSubject: 'MCF8315A three-phase sensorless-FOC BLDC motor driver',
      name: 'Operating Temperature', rawLabel: 'TJ', rawValue: '−40°C to 125°C', value: '−40–125', unit: '°C', kind: 'range', conditions: 'Operating junction temperature',
      page: 6, table: 'T-06-01', row: 'R-03', bbox: '[286, 392, 540, 408]', confidence: 0.99, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'Operating junction temperature −40°C to 125°C', hash: '9f2c7a1b4e8d6c03a5f1', updated: '2026-11-15 10:39' },
    { mpn: 'MCF8315A', doc: 'DS-1042', run: 'PR-20261115-1042-01', docType: 'Datasheet', docSubject: 'MCF8315A three-phase sensorless-FOC BLDC motor driver',
      name: 'Package', rawLabel: 'Package', rawValue: 'VQFN-24 (4 mm × 4 mm)', value: 'VQFN-24', unit: '—', kind: 'enum', conditions: '—',
      page: 1, table: 'T-01-01', row: 'R-05', bbox: '[402, 688, 566, 704]', confidence: 0.99, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'VQFN (24) 4 mm × 4 mm', hash: '9f2c7a1b4e8d6c03a5f1', updated: '2026-11-15 10:38' },
    { mpn: 'MCF8315A', doc: 'DS-1042', run: 'PR-20261115-1042-01', docType: 'Datasheet', docSubject: 'MCF8315A three-phase sensorless-FOC BLDC motor driver',
      name: 'PWM Frequency', rawLabel: 'fPWM', rawValue: 'up to 200 kHz (typ.)', value: '200', unit: 'kHz', kind: 'max', conditions: 'Configurable, TA = 25°C',
      page: 14, table: 'T-14-02', row: 'R-01', bbox: '[322, 558, 548, 574]', confidence: 0.71, status: 'Needs Review', applicability: 'Direct · MPN 匹配',
      snippet: 'PWM frequency configurable up to 200 kHz (typ.)', hash: '9f2c7a1b4e8d6c03a5f1', updated: '2026-11-15 10:44' },
    { mpn: 'STM32F103C8T6', doc: 'DS-1041', run: 'PR-20261114-1041-01', docType: 'Datasheet', docSubject: 'STM32F103x8/xB medium-density MCU',
      name: 'Core', rawLabel: 'Core', rawValue: 'ARM 32-bit Cortex-M3', value: 'ARM Cortex-M3', unit: '—', kind: 'enum', conditions: '—',
      page: 1, table: 'T-01-02', row: 'R-01', bbox: '[310, 740, 566, 756]', confidence: 0.99, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'ARM 32-bit Cortex-M3 CPU', hash: '3a1d9c6f2b7e8a04c1d2', updated: '2026-11-14 16:22' },
    { mpn: 'STM32F103C8T6', doc: 'DS-1041', run: 'PR-20261114-1041-01', docType: 'Datasheet', docSubject: 'STM32F103x8/xB medium-density MCU',
      name: 'Flash Memory', rawLabel: 'Flash memory', rawValue: '64 Kbytes', value: '64', unit: 'KB', kind: 'exact', conditions: '—',
      page: 1, table: 'T-01-02', row: 'R-04', bbox: '[310, 792, 566, 808]', confidence: 0.98, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: '64 Kbytes of Flash memory', hash: '3a1d9c6f2b7e8a04c1d2', updated: '2026-11-14 16:23' },
    { mpn: 'STM32F103C8T6', doc: 'DS-1041', run: 'PR-20261114-1041-01', docType: 'Datasheet', docSubject: 'STM32F103x8/xB medium-density MCU',
      name: 'Max Clock', rawLabel: 'fCPU', rawValue: 'up to 72 MHz', value: '72', unit: 'MHz', kind: 'max', conditions: '—',
      page: 2, table: 'T-02-01', row: 'R-02', bbox: '[304, 446, 540, 462]', confidence: 0.96, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'Up to 72 MHz operating frequency', hash: '3a1d9c6f2b7e8a04c1d2', updated: '2026-11-14 16:24' },
    { mpn: 'STM32F103C8T6', doc: 'DS-1041', run: 'PR-20261114-1041-01', docType: 'Datasheet', docSubject: 'STM32F103x8/xB medium-density MCU',
      name: 'ADC Resolution', rawLabel: 'ADC resolution', rawValue: '12-bit', value: '12', unit: 'bit', kind: 'exact', conditions: 'Up to 16 channels',
      page: 18, table: 'T-18-01', row: 'R-03', bbox: '[288, 372, 552, 388]', confidence: 0.74, status: 'Needs Review', applicability: 'Direct · MPN 匹配',
      snippet: '12-bit ADC with up to 16 channels', hash: '3a1d9c6f2b7e8a04c1d2', updated: '2026-11-14 16:26' },
    { mpn: 'LM317T', doc: 'DS-1040', run: 'PR-20261114-1040-01', docType: 'Datasheet', docSubject: 'LM317 adjustable three-terminal regulator',
      name: 'Output Voltage', rawLabel: 'VOUT', rawValue: '1.25 V to 37 V', value: '1.25–37', unit: 'V', kind: 'range', conditions: 'VIN − VOUT ≥ 3 V',
      page: 2, table: 'T-02-01', row: 'R-01', bbox: '[300, 418, 548, 434]', confidence: 0.99, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'Adjustable output from 1.25 V to 37 V', hash: 'c7e4b2a9d1f6e8035b9c', updated: '2026-11-14 09:50' },
    { mpn: 'LM317T', doc: 'DS-1040', run: 'PR-20261114-1040-01', docType: 'Datasheet', docSubject: 'LM317 adjustable three-terminal regulator',
      name: 'Output Current', rawLabel: 'IOUT', rawValue: '1.5 A', value: '1.5', unit: 'A', kind: 'guaranteed', conditions: 'Package thermal limits apply',
      page: 2, table: 'T-02-01', row: 'R-02', bbox: '[300, 440, 548, 456]', confidence: 0.99, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'Guaranteed 1.5 A output current', hash: 'c7e4b2a9d1f6e8035b9c', updated: '2026-11-14 09:51' },
    { mpn: 'LM317T', doc: 'DS-1040', run: 'PR-20261114-1040-01', docType: 'Datasheet', docSubject: 'LM317 adjustable three-terminal regulator',
      name: 'Dropout Voltage', rawLabel: 'Dropout voltage', rawValue: '2.5 V typ.', value: '2.5', unit: 'V', kind: 'typ', conditions: 'IOUT = 1.5 A, TA = 25°C',
      page: 4, table: 'T-04-01', row: 'R-08', bbox: '[318, 586, 552, 602]', confidence: 0.68, status: 'Needs Review', applicability: 'Direct · MPN 匹配',
      snippet: 'Dropout voltage, IOUT = 1.5 A (typ.)', hash: 'c7e4b2a9d1f6e8035b9c', updated: '2026-11-14 09:53' },
    { mpn: 'IRF540NPBF', doc: 'DS-1039', run: 'PR-20261113-1039-01', docType: 'Datasheet', docSubject: 'IRF540N N-channel power MOSFET',
      name: 'Drain-Source Voltage', rawLabel: 'VDS', rawValue: '100 V', value: '100', unit: 'V', kind: 'max', conditions: 'TC = 25°C',
      page: 1, table: 'T-01-01', row: 'R-02', bbox: '[306, 512, 548, 528]', confidence: 0.99, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'VDS = 100 V', hash: '5b8f0d3c6a2e7f914d08', updated: '2026-11-13 14:30' },
    { mpn: 'IRF540NPBF', doc: 'DS-1039', run: 'PR-20261113-1039-01', docType: 'Datasheet', docSubject: 'IRF540N N-channel power MOSFET',
      name: 'Continuous Drain Current', rawLabel: 'ID', rawValue: '33 A', value: '33', unit: 'A', kind: 'max', conditions: 'TC = 25°C',
      page: 1, table: 'T-01-01', row: 'R-03', bbox: '[306, 534, 548, 550]', confidence: 0.97, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'ID = 33 A at TC = 25°C', hash: '5b8f0d3c6a2e7f914d08', updated: '2026-11-13 14:31' },
    { mpn: 'IRF540NPBF', doc: 'DS-1039', run: 'PR-20261113-1039-01', docType: 'Datasheet', docSubject: 'IRF540N N-channel power MOSFET',
      name: 'RDS(on)', rawLabel: 'RDS(on)', rawValue: '44 mΩ max.', value: '44', unit: 'mΩ', kind: 'max', conditions: 'VGS = 10 V, ID = 16.5 A',
      page: 2, table: 'T-02-01', row: 'R-05', bbox: '[322, 468, 556, 484]', confidence: 0.73, status: 'Needs Review', applicability: 'Direct · MPN 匹配',
      snippet: 'RDS(on) max 44 mΩ at VGS = 10 V', hash: '5b8f0d3c6a2e7f914d08', updated: '2026-11-13 14:33' },
    { mpn: 'TLP185(GB)', doc: 'DS-1037', run: 'PR-20261112-1037-01', docType: 'Datasheet', docSubject: 'TLP185 photocoupler',
      name: 'Current Transfer Ratio', rawLabel: 'CTR', rawValue: '50% to 600%', value: '50–600', unit: '%', kind: 'range', conditions: 'IF = 5 mA, VCE = 5 V, TA = 25°C',
      page: 3, table: 'T-03-02', row: 'R-02', bbox: '[304, 498, 552, 514]', confidence: 0.95, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'CTR 50% to 600% at IF = 5 mA', hash: '7d3b9f5a2c8e4d01b6f7', updated: '2026-11-12 11:20' },
    { mpn: 'TLP185(GB)', doc: 'DS-1037', run: 'PR-20261112-1037-01', docType: 'Datasheet', docSubject: 'TLP185 photocoupler',
      name: 'Isolation Voltage', rawLabel: 'BV', rawValue: '3750 Vrms', value: '3750', unit: 'Vrms', kind: 'max', conditions: 'AC, 60 s',
      page: 1, table: 'T-01-01', row: 'R-04', bbox: '[298, 620, 548, 636]', confidence: 0.98, status: 'Verified', applicability: 'Direct · MPN 匹配',
      snippet: 'Isolation voltage 3750 Vrms', hash: '7d3b9f5a2c8e4d01b6f7', updated: '2026-11-12 11:18' }
  ];


  /* ------------------------------------------------------------------ 内容 */
  /* origin: manual = 人工内容独立审批；dsbit = 引用 Ds Bit 参数，必须有内容版本审核记录 + 发布批次授权（release）才能发布 */
  D.contents = [
    { id: 'CNT-201', title: 'Selecting the MCF8315A for BLDC motor drive designs', type: '技术文章', mpn: 'MCF8315A', origin: 'dsbit', source: 'Ds Bit 已审核参数', ai: 'AI Generated', review: 'Pending Review', publish: 'Draft', release: null, updated: '2026-11-16 09:30', channel: 'SEO / GEO' },
    { id: 'CNT-200', title: '48V motor drive comparison: MCF8315A vs DRV8313', type: '产品对比', mpn: 'MCF8315A', origin: 'dsbit', source: 'Ds Bit 已审核参数', ai: 'AI Generated', review: 'Approved', publish: 'Draft', release: null, updated: '2026-11-16 08:55', channel: 'SEO / LinkedIn' },
    { id: 'CNT-199', title: 'STM32F103C8T6 minimal system design guide', type: '选型指南', mpn: 'STM32F103C8T6', origin: 'dsbit', source: 'Ds Bit 参数（含待审核）', ai: 'AI Generated', review: 'Needs Revision', publish: 'Draft', release: null, updated: '2026-11-15 17:10', channel: 'SEO' },
    { id: 'CNT-198', title: 'Five optocoupler isolation pitfalls in industrial control', type: '技术文章', mpn: 'TLP185(GB)', origin: 'dsbit', source: '人工撰写 + Ds Bit 引用', ai: 'Human', review: 'Approved', publish: 'Published', release: { mode: 'dsbit', ref: 'RA-20261115-02', batch: 'B-20261115-02', version: 'v1' }, updated: '2026-11-15 14:20', channel: 'SEO / LinkedIn' },
    { id: 'CNT-197', title: 'How to select a BLDC driver for battery-powered tools', type: '技术文章', mpn: 'MCF8315A', origin: 'dsbit', source: 'Ds Bit 已审核参数', ai: 'AI Generated', review: 'Approved', publish: 'Published', release: { mode: 'dsbit', ref: 'RA-20261115-01', batch: 'B-20261115-01', version: 'v2' }, updated: '2026-11-15 11:05', channel: 'SEO / GEO' },
    { id: 'CNT-196', title: 'Thermal design for LM317 linear regulators', type: '技术问答', mpn: 'LM317T', origin: 'dsbit', source: 'Ds Bit 已审核参数', ai: 'AI Generated', review: 'Approved', publish: 'Published', release: { mode: 'dsbit', ref: 'RA-20261114-01', batch: 'B-20261114-01', version: 'v1' }, updated: '2026-11-14 16:40', channel: 'GEO / Facebook' },
    { id: 'CNT-195', title: '1N4148W vs BAV99: small-signal diode substitution', type: '产品对比', mpn: '1N4148W', origin: 'manual', source: '人工撰写', ai: 'Human', review: 'Pending Review', publish: 'Draft', release: null, updated: '2026-11-14 10:18', channel: 'SEO' },
    { id: 'CNT-194', title: '2026 Q4 product and lead-time newsletter', type: '新闻公告', mpn: '—', origin: 'manual', source: '人工撰写', ai: 'Human', review: 'Approved', publish: 'Published', release: { mode: 'manual', ref: 'MA-20261113-01', batch: '人工内容审批', version: 'v1' }, updated: '2026-11-13 09:00', channel: 'Facebook / 站内' },
    { id: 'CNT-193', title: 'ESP32-WROOM-32E certification and RF layout', type: '技术文章', mpn: 'ESP32-WROOM-32E', origin: 'dsbit', source: 'Ds Bit 参数（含待审核）', ai: 'AI Generated', review: 'Needs Revision', publish: 'Draft', release: null, updated: '2026-11-12 15:30', channel: 'SEO' },
    { id: 'CNT-192', title: 'Hall-effect current sensing in motor control', type: '应用方案', mpn: 'ACS712ELCTR-05B-T', origin: 'dsbit', source: 'Ds Bit 已审核参数', ai: 'AI Generated', review: 'Approved', publish: 'Published', release: { mode: 'dsbit', ref: 'RA-20261112-01', batch: 'B-20261112-01', version: 'v1' }, updated: '2026-11-12 10:12', channel: 'SEO / YouTube' }
  ];

  /* ------------------------------------------------------------------ 社媒 */
  D.social = [
    { id: 'linkedin', name: 'LinkedIn', handle: 'Morris Electronic HK', connected: 'Demo Connected', followers: 4280, posts: 38, engagement: '3.8%', clicks: 1240, inquiries: 18, tone: '专业工程视角' },
    { id: 'facebook', name: 'Facebook', handle: 'Morris Electronic', connected: 'Demo Connected', followers: 12600, posts: 52, engagement: '2.9%', clicks: 980, inquiries: 12, tone: '应用场景与案例' },
    { id: 'youtube', name: 'YouTube', handle: 'Morris Precision Industrial', connected: 'Demo Connected', followers: 1860, posts: 14, engagement: '5.1%', clicks: 640, inquiries: 9, tone: '3 分钟技术讲解' }
  ];

  D.calendar = [
    { id: 'EV-01', title: 'MCF8315A selection highlights', platform: 'LinkedIn', date: '2026-11-16', time: '10:00', status: 'Approved', owner: '李哲', mpn: 'MCF8315A' },
    { id: 'EV-02', title: 'LM317 thermal design Q&A', platform: 'Facebook', date: '2026-11-17', time: '09:30', status: 'Pending Review', owner: '孙悦', mpn: 'LM317T' },
    { id: 'EV-03', title: 'BLDC drive comparison (video)', platform: 'YouTube', date: '2026-11-18', time: '15:00', status: 'Scheduled', owner: '李哲', mpn: 'MCF8315A' },
    { id: 'EV-04', title: 'Five optocoupler isolation pitfalls', platform: 'LinkedIn', date: '2026-11-19', time: '11:00', status: 'Draft', owner: '孙悦', mpn: 'TLP185(GB)' },
    { id: 'EV-05', title: '1N4148W vs BAV99 substitution', platform: 'Facebook', date: '2026-11-20', time: '14:00', status: 'Approved', owner: '李哲', mpn: '1N4148W' },
    { id: 'EV-06', title: 'STM32F103 minimal system', platform: 'LinkedIn', date: '2026-11-23', time: '10:00', status: 'Scheduled', owner: '孙悦', mpn: 'STM32F103C8T6' },
    { id: 'EV-07', title: 'Current sensor selection in 3 minutes', platform: 'YouTube', date: '2026-11-24', time: '16:00', status: 'Draft', owner: '李哲', mpn: 'ACS712ELCTR-05B-T' },
    { id: 'EV-08', title: 'ESP32 RF layout highlights', platform: 'LinkedIn', date: '2026-11-25', time: '09:00', status: 'Failed', owner: '孙悦', mpn: 'ESP32-WROOM-32E' },
    { id: 'EV-09', title: 'Q4 product and lead-time newsletter', platform: 'Facebook', date: '2026-11-26', time: '13:00', status: 'Published', owner: '李哲', mpn: '—' },
    { id: 'EV-10', title: 'MLCC selection: X7R vs X5R', platform: 'YouTube', date: '2026-11-27', time: '10:30', status: 'Pending Review', owner: '孙悦', mpn: 'GRM188R71H104KA93D' },
    { id: 'EV-11', title: 'MCF8315A application case', platform: 'LinkedIn', date: '2026-11-30', time: '11:00', status: 'Approved', owner: '李哲', mpn: 'MCF8315A' },
    { id: 'EV-12', title: 'December product preview', platform: 'LinkedIn', date: '2026-12-02', time: '10:00', status: 'Scheduled', owner: '孙悦', mpn: '—' }
  ];

  D.videos = [
    { id: 'VID-31', title: 'MCF8315A BLDC drive solution in 3 minutes', mpn: 'MCF8315A', status: 'Published', platform: 'YouTube', views: 12480, avg: '2:14', clicks: 860, inquiries: 14, landing: '/en/products/mcf8315a', utm: 'utm_source=youtube&utm_medium=video&utm_campaign=q4_motor&utm_content=vid-31', updated: '2026-11-14', cover: 'MCF8315A' },
    { id: 'VID-30', title: 'Choosing between 48V and 24V motor drives', mpn: 'MCF8315A', status: 'Editing', platform: 'YouTube', views: 0, avg: '—', clicks: 0, inquiries: 0, landing: '/en/guides/48v-vs-24v-motor-drive', utm: 'utm_source=youtube&utm_medium=video&utm_campaign=q4_motor&utm_content=vid-30', updated: '2026-11-16', cover: '48V' },
    { id: 'VID-29', title: 'Five optocoupler isolation pitfalls', mpn: 'TLP185(GB)', status: 'Review', platform: 'YouTube', views: 0, avg: '—', clicks: 0, inquiries: 0, landing: '/en/products/tlp185-gb', utm: 'utm_source=youtube&utm_medium=video&utm_campaign=isolation&utm_content=vid-29', updated: '2026-11-15', cover: 'TLP185' },
    { id: 'VID-28', title: 'LM317 thermal calculation walkthrough', mpn: 'LM317T', status: 'Script', platform: 'YouTube', views: 0, avg: '—', clicks: 0, inquiries: 0, landing: '/en/products/lm317t', utm: 'utm_source=youtube&utm_medium=video&utm_campaign=power&utm_content=vid-28', updated: '2026-11-15', cover: 'LM317' },
    { id: 'VID-27', title: 'Hall-effect current sensor selection', mpn: 'ACS712ELCTR-05B-T', status: 'Idea', platform: 'YouTube', views: 0, avg: '—', clicks: 0, inquiries: 0, landing: '/en/products/acs712elctr-05b-t', utm: 'utm_source=youtube&utm_medium=video&utm_campaign=sensors&utm_content=vid-27', updated: '2026-11-13', cover: 'ACS712' },
    { id: 'VID-26', title: 'MLCC selection: X7R vs X5R', mpn: 'GRM188R71H104KA93D', status: 'Published', platform: 'YouTube', views: 8920, avg: '1:58', clicks: 540, inquiries: 9, landing: '/en/products/grm188r71h104ka93d', utm: 'utm_source=youtube&utm_medium=video&utm_campaign=passives&utm_content=vid-26', updated: '2026-11-10', cover: 'MLCC' }
  ];

  /* ------------------------------------------------------------------ 询盘 */
  D.inquiries = [
    { lead: 'LD-20261116-001', request: 'RQ-8f3a2c', mpn: 'MCF8315A', qty: 5000, channel: 'Google Organic', utm: 'utm_source=google&utm_medium=organic', landing: '/en/products/mcf8315a', session: 'sess_demo_7f3a91', country: 'Germany', status: 'New', spam: 0.05, duplicate: '—', created: '2026-11-16 09:12', owner: '未分配' },
    { lead: 'LD-20261116-002', request: 'RQ-1b9d7e', mpn: 'STM32F103C8T6', qty: 1200, channel: 'LinkedIn', utm: 'utm_source=linkedin&utm_campaign=q4_motor', landing: '/en/products/stm32f103c8t6', session: 'sess_demo_2b9d44', country: 'Poland', status: 'Assigned', spam: 0.03, duplicate: '—', created: '2026-11-16 08:45', owner: '王敏' },
    { lead: 'LD-20261115-014', request: 'RQ-4c6e1a', mpn: 'IRF540NPBF', qty: 20000, channel: 'YouTube', utm: 'utm_source=youtube&utm_medium=video', landing: '/en/products/irf540npbf', session: 'sess_demo_4c6e08', country: 'Brazil', status: 'Quoted', spam: 0.02, duplicate: '—', created: '2026-11-15 17:22', owner: '赵磊' },
    { lead: 'LD-20261115-011', request: 'RQ-7a2f9c', mpn: 'LM317T', qty: 800, channel: 'Facebook', utm: 'utm_source=facebook&utm_medium=social', landing: '/en/products/lm317t', session: 'sess_demo_7a2f13', country: 'India', status: 'Won', spam: 0.01, duplicate: '—', created: '2026-11-15 14:08', owner: '王敏' },
    { lead: 'LD-20261115-007', request: 'RQ-2d8b4f', mpn: 'TLP185(GB)', qty: 300, channel: 'Google Organic', utm: 'utm_source=google&utm_medium=organic', landing: '/en/products/tlp185-gb', session: 'sess_demo_2d8b76', country: 'USA', status: 'Lost', spam: 0.04, duplicate: '—', created: '2026-11-15 11:30', owner: '赵磊' },
    { lead: 'LD-20261115-003', request: 'RQ-9e1c6d', mpn: 'ESP32-WROOM-32E', qty: 50, channel: 'LinkedIn', utm: 'utm_source=linkedin', landing: '/en/products/esp32-wroom-32e', session: 'sess_demo_9e1c02', country: 'Vietnam', status: 'New', spam: 0.06, duplicate: '—', created: '2026-11-15 09:05', owner: '未分配' },
    { lead: 'LD-20261114-021', request: 'RQ-6f4a8b', mpn: 'MCF8315A', qty: 5000, channel: 'Google Organic', utm: 'utm_source=google&utm_medium=organic', landing: '/en/products/mcf8315a', session: 'sess_demo_6f4a55', country: 'Germany', status: 'Spam', spam: 0.92, duplicate: '—', created: '2026-11-14 16:44', owner: '—' },
    { lead: 'LD-20261114-018', request: 'RQ-3b7d1e', mpn: 'MCF8315A', qty: 5000, channel: 'Google Organic', utm: 'utm_source=google&utm_medium=organic', landing: '/en/products/mcf8315a', session: 'sess_demo_3b7d90', country: 'Germany', status: 'Assigned', spam: 0.07, duplicate: 'LD-20261114-021? 否 / 与 LD-20261116-001 内容重复', created: '2026-11-14 15:20', owner: '王敏' }
  ];

  /* ------------------------------------------------------------------ 用户 / 角色 / 审计 / 审批 */
  D.users = [
    { name: '陈立', email: 'chen.li@morrishk.net', role: '管理员', status: 'Active', last: '2026-11-16 09:40', mfa: 'Enabled' },
    { name: '王敏', email: 'wang.min@morrishk.net', role: '商城运营', status: 'Active', last: '2026-11-16 09:22', mfa: 'Enabled' },
    { name: '李哲', email: 'li.zhe@morrishk.net', role: '营销运营', status: 'Active', last: '2026-11-16 09:18', mfa: 'Enabled' },
    { name: '周倩', email: 'zhou.qian@morrishk.net', role: '技术数据审核', status: 'Active', last: '2026-11-16 08:56', mfa: 'Enabled' },
    { name: '赵磊', email: 'zhao.lei@morrishk.net', role: '商城运营', status: 'Active', last: '2026-11-15 18:10', mfa: 'Enabled' },
    { name: '孙悦', email: 'sun.yue@morrishk.net', role: '营销运营', status: 'Active', last: '2026-11-15 17:45', mfa: 'Invited' },
    { name: 'svc-dsbit', email: 'svc-dsbit@morrishk.net', role: '集成账号（只读）', status: 'Active', last: '2026-11-16 09:35', mfa: 'API Key' },
    { name: 'audit-ro', email: 'audit@morrishk.net', role: '审计只读', status: 'Active', last: '2026-11-10 10:02', mfa: 'Enabled' }
  ];

  D.roles = [
    { id: 'commerce', name: '商城运营', desc: '维护商品、分类、库存与询盘；不可修改 Ds Bit 原始证据' },
    { id: 'marketing', name: '营销运营', desc: '创建与审核营销草稿、管理发布计划；不可改库存/价格/技术参数' },
    { id: 'data', name: '技术数据审核', desc: '审核 Ds Bit 参数；不直接发布社媒内容' },
    { id: 'admin', name: '管理员', desc: '用户、角色、权限与审计统一管理' }
  ];

  D.permissions = [
    { area: '商品与分类', commerce: 'allow', marketing: 'read', data: 'read', admin: 'allow' },
    { area: '库存与报价', commerce: 'allow', marketing: 'deny', data: 'read', admin: 'allow' },
    { area: '询盘管理', commerce: 'allow', marketing: 'read', data: 'deny', admin: 'allow' },
    { area: 'Ds Bit 证据', commerce: 'read', marketing: 'read', data: 'allow', admin: 'allow' },
    { area: '参数审核', commerce: 'deny', marketing: 'deny', data: 'allow', admin: 'allow' },
    { area: 'SEO / GEO 内容', commerce: 'read', marketing: 'allow', data: 'read', admin: 'allow' },
    { area: '社媒发布', commerce: 'deny', marketing: 'allow', data: 'deny', admin: 'allow' },
    { area: '用户与权限', commerce: 'deny', marketing: 'deny', data: 'deny', admin: 'allow' },
    { area: '操作审计', commerce: 'deny', marketing: 'deny', data: 'deny', admin: 'allow' }
  ];

  D.approvals = [
    { id: 'AP-311', title: 'MCF8315A 选型要点（技术文章）', type: '内容发布', requester: '李哲', reviewer: '营销运营负责人', status: 'Pending', submitted: '2026-11-16 09:31' },
    { id: 'AP-310', title: 'MCF8315A RDS(on) 参数降级', type: '参数审核', requester: '周倩', reviewer: '技术数据审核', status: 'Pending', submitted: '2026-11-16 09:05' },
    { id: 'AP-309', title: '11/17 LM317 问答发布排期', type: '社媒排期', requester: '孙悦', reviewer: '营销运营负责人', status: 'Pending', submitted: '2026-11-15 18:20' },
    { id: 'AP-308', title: 'STM32F103C8T6 详情页发布', type: '商品发布', requester: '王敏', reviewer: '商城运营负责人', status: 'Pending', submitted: '2026-11-15 17:05' },
    { id: 'AP-307', title: 'ESP32 射频布局文章', type: '内容发布', requester: '李哲', reviewer: '营销运营负责人', status: 'Returned', submitted: '2026-11-15 11:30' },
    { id: 'AP-306', title: 'Q4 新品通讯（Facebook）', type: '社媒排期', requester: '李哲', reviewer: '营销运营负责人', status: 'Approved', submitted: '2026-11-13 09:10' }
  ];

  D.audit = [
    { time: '2026-11-16 09:42', actor: '周倩', action: '审核参数', object: 'MCF8315A / Supply Voltage', result: 'Approved', ip: '10.20.3.18' },
    { time: '2026-11-16 09:35', actor: 'svc-dsbit', action: '写入解析结果', object: 'DS-1038 / 64 pages', result: 'Success', ip: '10.20.5.6' },
    { time: '2026-11-16 09:31', actor: '李哲', action: '提交内容审核', object: 'CNT-201', result: 'Pending', ip: '10.20.4.22' },
    { time: '2026-11-16 09:22', actor: '王敏', action: '更新库存', object: 'STM32F103C8T6 / 320', result: 'Success', ip: '10.20.4.11' },
    { time: '2026-11-16 09:12', actor: 'system', action: '询盘入库', object: 'LD-20261116-001', result: 'Success', ip: '10.20.5.6' },
    { time: '2026-11-16 08:55', actor: '周倩', action: '上传 Datasheet', object: 'DS-1038', result: 'Success', ip: '10.20.3.18' },
    { time: '2026-11-15 18:20', actor: '孙悦', action: '创建排期', object: 'EV-02', result: 'Pending', ip: '10.20.4.30' },
    { time: '2026-11-15 17:26', actor: '王敏', action: '发布商品', object: 'LM317T', result: 'Success', ip: '10.20.4.11' },
    { time: '2026-11-15 17:05', actor: '王敏', action: '提交商品发布', object: 'STM32F103C8T6', result: 'Pending', ip: '10.20.4.11' },
    { time: '2026-11-15 16:12', actor: '李哲', action: '生成营销草稿', object: 'CNT-200', result: 'Success', ip: '10.20.4.22' },
    { time: '2026-11-15 14:20', actor: '李哲', action: '发布内容', object: 'CNT-198', result: 'Success', ip: '10.20.4.22' },
    { time: '2026-11-15 11:30', actor: '李哲', action: '提交内容审核', object: 'CNT-193', result: 'Returned', ip: '10.20.4.22' }
  ];

  /* ------------------------------------------------------------------ 营销 */
  D.campaigns = [
    { id: 'CMP-12', name: 'Q4 电机驱动主题月', channels: 'SEO / GEO / LinkedIn', period: '2026-11-01 → 2026-11-30', status: 'Active', contents: 8, leads: 28, valid: 11, owner: '李哲' },
    { id: 'CMP-11', name: '48V 工业电源选型季', channels: 'SEO / YouTube', period: '2026-11-10 → 2026-12-15', status: 'Active', contents: 5, leads: 14, valid: 6, owner: '孙悦' },
    { id: 'CMP-10', name: 'Datasheet 证据链信任计划', channels: 'GEO / LinkedIn', period: '2026-10-15 → 2026-11-15', status: 'Completed', contents: 6, leads: 19, valid: 8, owner: '李哲' },
    { id: 'CMP-09', name: '被动器件替代选型专题', channels: 'SEO / Facebook', period: '2026-11-20 → 2026-12-31', status: 'Planned', contents: 3, leads: 0, valid: 0, owner: '孙悦' },
    { id: 'CMP-08', name: '光耦隔离应用月', channels: 'SEO / LinkedIn', period: '2026-09-01 → 2026-09-30', status: 'Completed', contents: 4, leads: 12, valid: 5, owner: '李哲' },
    { id: 'CMP-07', name: 'Q1 新品预热', channels: 'Facebook / YouTube', period: '2026-12-10 → 2027-01-20', status: 'Draft', contents: 0, leads: 0, valid: 0, owner: '孙悦' }
  ];

  D.searchTerms = [
    { term: 'MCF8315A', type: 'Product', impressions: 1240, ctr: '8.4%', position: 2.1, result: 'Good' },
    { term: 'bldc motor driver 48v', type: 'Category', impressions: 3860, ctr: '5.2%', position: 4.6, result: 'Opportunity' },
    { term: 'STM32F103C8T6 datasheet', type: 'Product', impressions: 2210, ctr: '7.1%', position: 3.2, result: 'Good' },
    { term: 'LM317 heatsink calculation', type: 'Article', impressions: 980, ctr: '4.8%', position: 6.1, result: 'Opportunity' },
    { term: 'IRF540N alternative', type: 'Product', impressions: 760, ctr: '3.9%', position: 8.4, result: 'Needs Content' },
    { term: '光耦 隔离 设计', type: 'Article', impressions: 420, ctr: '6.2%', position: 5.0, result: 'Good' }
  ];

  D.zeroTerms = [
    { term: 'MCF8315A-Q1', hits: 96, intent: 'Automotive variant', action: 'Create landing or state not stocked' },
    { term: 'DRV8313 comparison', hits: 71, intent: 'Comparison', action: 'Create comparison content' },
    { term: 'IPM module 1kW', hits: 58, intent: 'Category gap', action: 'Review category coverage' },
    { term: 'TLP185 replacement', hits: 44, intent: 'EOL alternative', action: 'Link EOL alternative page' }
  ];

  D.synonyms = [
    { term: 'MOSFET', mapped: '场效应管 / FET', type: 'Bilingual' },
    { term: 'MLCC', mapped: '贴片电容 / ceramic capacitor', type: 'Abbreviation' },
    { term: 'MCU', mapped: '单片机 / microcontroller', type: 'Abbreviation' },
    { term: '光耦', mapped: 'optocoupler / photocoupler', type: 'Bilingual' }
  ];

  /* ------------------------------------------------------------------ 任务 / 通知 */
  D.tasks = [
    { id: 'T-91', title: 'MCF8315A 待审核参数 2 项', module: '产品参数审核', priority: 'P1', due: '今天 12:00', owner: '周倩', status: 'Open' },
    { id: 'T-90', title: 'CNT-201 技术文章待审核', module: '内容资产库', priority: 'P1', due: '今天 14:00', owner: '李哲', status: 'Open' },
    { id: 'T-89', title: 'EV-08 发布失败待重试', module: '社媒发布日历', priority: 'P1', due: '今天 10:30', owner: '孙悦', status: 'Open' },
    { id: 'T-88', title: 'DS-1038 解析任务长时间运行', module: 'Datasheet 文档管理', priority: 'P2', due: '今天 18:00', owner: '周倩', status: 'Open' },
    { id: 'T-87', title: '5 条询盘待分配', module: '询盘管理', priority: 'P1', due: '今天 11:00', owner: '王敏', status: 'Open' },
    { id: 'T-86', title: 'STM32F103C8T6 详情页待发布', module: '商品详情页管理', priority: 'P2', due: '明天', owner: '王敏', status: 'Open' },
    { id: 'T-85', title: '11/17 Facebook 排期待审核', module: '审批流程', priority: 'P2', due: '明天', owner: '李哲', status: 'Open' },
    { id: 'T-84', title: 'NE555DR 缺货页面提示确认', module: '商品管理', priority: 'P3', due: '11-18', owner: '赵磊', status: 'Open' }
  ];

  D.notices = [
    { id: 'N-51', title: 'Ds Bit 完成 42 份 Datasheet 解析', body: '其中 3 份存在质量异常，已进入待审核队列。', time: '2026-11-16 09:36', type: 'Ds Bit', read: false },
    { id: 'N-50', title: 'EV-08 社媒发布失败', body: 'LinkedIn 发布任务返回 Demo 错误；可在日历中重试。', time: '2026-11-16 09:02', type: '社媒', read: false },
    { id: 'N-49', title: 'GA4 尚未连接', body: '营销归因数据为 Demo 估算，接入后需重新核对。', time: '2026-11-16 08:30', type: '系统', read: false },
    { id: 'N-48', title: '权限变更待确认', body: '孙悦的营销运营角色新增“内容审核”权限，等待管理员确认。', time: '2026-11-15 18:22', type: '系统', read: false },
    { id: 'N-47', title: '本周内容日历已生成', body: '11/16–11/22 共 6 条排期，其中 2 条待审核。', time: '2026-11-15 17:00', type: '营销', read: false },
    { id: 'N-46', title: '存储容量提醒', body: 'Datasheet 附件占用 68%，接近 Demo 阈值。', time: '2026-11-14 10:12', type: '系统', read: true }
  ];

  /* ------------------------------------------------------------------ 概览指标 */
  D.overview = {
    kpis: [
      { k: '商品总数', v: '10.09M', note: '全站 SKU', delta: '+0.4%', icon: 'box' },
      { k: '已发布商品', v: '9.84M', note: '97.5% 已发布', delta: '+0.2%', icon: 'check' },
      { k: '待审核商品', v: '1,268', note: '含 412 待补参数', delta: '+36', warn: true, icon: 'clock' },
      { k: '今日访客', v: '48,210', note: 'UV（Demo）', delta: '+6.8%', icon: 'users' },
      { k: '自然搜索流量', v: '32,480', note: '占访客 67.4%', delta: '+9.1%', icon: 'search' },
      { k: '社媒引流', v: '6,120', note: 'LinkedIn / FB', delta: '+4.2%', icon: 'share' },
      { k: '视频引流', v: '3,840', note: 'YouTube', delta: '+11.5%', icon: 'video' },
      { k: '今日询盘', v: '126', note: '提交量', delta: '+18', icon: 'inbox' },
      { k: '有效询盘率', v: '38.4%', note: '剔除 Spam / 重复', delta: '+1.6pt', icon: 'target' },
      { k: '待处理任务', v: '23', note: 'P1 6 项', delta: '需处理', warn: true, icon: 'clipboard' }
    ],
    traffic: [42, 44, 43, 47, 49, 46, 51, 53, 50, 55, 58, 56, 60, 63, 61, 64, 62, 66, 69, 67, 71, 74, 72, 76, 79, 77, 81, 84, 82, 86],
    inquiries: [8, 11, 9, 12, 14, 10, 13, 16, 12, 15, 18, 14, 17, 19, 16, 20, 21, 18, 22, 24, 20, 23, 25, 22, 26, 28, 24, 27, 29, 31],
    channelShare: [
      { k: '自然搜索', v: 62, cls: 'viz-seg-1' },
      { k: '社媒', v: 14, cls: 'viz-seg-2' },
      { k: '视频', v: 9, cls: 'viz-seg-3' },
      { k: '直接 / 其他', v: 15, cls: 'viz-seg-4' }
    ],
    channels: [
      { k: 'Google Organic', impressions: '1.24M', clicks: '86.4K', ctr: '6.97%', leads: 1042, valid: 39.8, trend: [20, 24, 22, 27, 29, 26, 31] },
      { k: 'LinkedIn', impressions: '186K', clicks: '14.2K', ctr: '7.63%', leads: 268, valid: 41.2, trend: [8, 9, 11, 10, 13, 12, 14] },
      { k: 'Facebook', impressions: '142K', clicks: '9.8K', ctr: '6.90%', leads: 186, valid: 35.5, trend: [6, 7, 6, 8, 9, 8, 10] },
      { k: 'YouTube', impressions: '98K', clicks: '6.4K', ctr: '6.53%', leads: 132, valid: 44.7, trend: [4, 5, 6, 5, 7, 8, 9] },
      { k: 'GEO / AI Referral（抽样）', impressions: '—', clicks: '2.1K', ctr: '—', leads: 64, valid: 32.8, trend: [2, 3, 2, 4, 3, 5, 6] }
    ],
    funnel: [
      { k: '曝光', v: 1240000, rate: '100%' },
      { k: '点击', v: 86400, rate: '6.97%' },
      { k: '商品详情页访问', v: 41200, rate: '47.7%' },
      { k: '询盘提交', v: 1860, rate: '4.51%' },
      { k: '有效询盘', v: 714, rate: '38.4%' }
    ]
  };

  /* ------------------------------------------------------------------ 数据分析口径 / SEO 技术治理 */
  D.analytics = {
    sourceLayers: [
      { layer: '平台原生数据', source: 'Search Console / LinkedIn / Facebook / YouTube', measures: '曝光、点击、平台侧互动', status: '未连接', note: '只代表平台内行为，不能等同于站内询盘或有效询盘' },
      { layer: '网站行为数据', source: 'GA4', measures: '会话、页面浏览、generate_lead 事件', status: '未连接', note: 'generate_lead 是前端事件，包含 Spam、重复与测试提交' },
      { layer: '后台业务数据', source: 'Morrishk Intelligence', measures: 'LeadNo、RequestId、有效询盘', status: 'Demo 数据', note: '唯一可判定询盘有效性的口径' }
    ],
    leadBridge: [
      { event: 'generate_lead（GA4 事件）', v: 1860, note: '前端触发次数，未去重' },
      { event: '询盘入库（RequestId 去重）', v: 1724, note: '后台可见的询盘记录' },
      { event: '有效询盘（后台判定）', v: 714, note: '剔除 Spam、重复与无效联系方式' }
    ],
    geo: {
      aiReferral: { sessions: 2140, note: 'GA4 referral 中来自 AI 域名的会话（Demo 抽样）' },
      coverage: { pieces: 6, total: 12, note: '具备证据与适用边界的 GEO 内容 / 目标内容' },
      citations: { samples: 40, cited: 11, note: '人工抽样 40 条 AI 回答，11 条引用本站（非全量）' }
    }
  };

  D.seoGovernance = {
    urlRows: [
      { url: '/en/products/mcf8315a', canonical: '/en/products/mcf8315a', index: 'Index', hreflang: '5 / 5', status: '正常' },
      { url: '/en/products/stm32f103c8t6?ref=list', canonical: '/en/products/stm32f103c8t6', index: 'Index', hreflang: '5 / 5', status: '参数页重复' },
      { url: '/en/search?q=motor', canonical: '/en/search', index: 'Noindex', hreflang: '—', status: '正常' },
      { url: '/en/products/ne555dr', canonical: '/en/products/ne555dr', index: 'Index', hreflang: '4 / 5', status: '缺 ja hreflang' },
      { url: '/de/products/lm317t', canonical: '/en/products/lm317t', index: 'Index', hreflang: '5 / 5', status: 'canonical 指向 en' }
    ],
    hreflang: [
      { lang: 'en', urls: '9.84M', missing: 0, status: '正常' },
      { lang: 'de', urls: '1.96M', missing: 1240, status: '待补' },
      { lang: 'ja', urls: '1.82M', missing: 3860, status: '待补' },
      { lang: 'es', urls: '1.78M', missing: 2410, status: '待补' },
      { lang: 'fr', urls: '1.71M', missing: 1980, status: '待补' }
    ],
    sitemaps: [
      { shard: 'sitemap-products-01.xml', urls: '50,000', updated: '2026-11-16 06:00', status: '正常' },
      { shard: 'sitemap-products-02.xml', urls: '50,000', updated: '2026-11-16 06:00', status: '正常' },
      { shard: 'sitemap-products-03.xml', urls: '38,420', updated: '2026-11-15 06:00', status: '滞后 1 天' },
      { shard: 'sitemap-categories.xml', urls: '4,180', updated: '2026-11-16 06:00', status: '正常' },
      { shard: 'sitemap-content.xml', urls: '12,640', updated: '2026-11-16 06:00', status: '正常' },
      { shard: 'sitemap-help-news.xml', urls: '1,260', updated: '2026-11-14 06:00', status: '失败待重试' }
    ],
    quality: [
      { issue: '重复内容风险', count: '12,480', detail: '参数页与分类页 Title / 描述高度重复', action: '合并 canonical 或补充差异化内容' },
      { issue: '结构化数据错误', count: '1,206', detail: 'Product / Offer 字段缺失或类型错误', action: '按 shard 修复后重新校验' },
      { issue: '低质量页面', count: '3,842', detail: '无参数、无描述、无可引用证据', action: '补充内容或转 Noindex' },
      { issue: '404 / 软 404', count: '214', detail: '旧站迁移链接与分页参数失效', action: '配置 301 或返回 410' },
      { issue: '重定向链', count: '96', detail: '两次以上跳转，浪费抓取预算', action: '压平为单跳' }
    ],
    release: {
      batch: '≤ 5,000 URL / 批',
      canary: '首批 1% 抽样',
      rollback: '发布前快照，按批次回滚',
      approval: 'SEO + 商城运营双人确认',
      note: '不提供“一键全量发布千万页面”；所有规则变更必须分批灰度并保留回滚点'
    }
  };

  /* ------------------------------------------------------------------ 旧后台 commands（11 个文件） */
  D.legacyCommands = [
    { file: 'AdminAsset.php', actions: '—（AssetBundle）', purpose: '后台静态资源包', module: '新后台前端资产', status: '不适用', note: 'Build 体系替换，不属于业务命令' },
    { file: 'AdminController.php', actions: 'init / behaviors / logs', purpose: '后台基类、登录鉴权与日志辅助', module: '系统管理 · 权限与审计', status: '部分覆盖', note: '权限矩阵与审计页已设计，基类实现不迁移' },
    { file: 'CController.php', actions: '7 个（URL 生成 / 提交 / 商品 / 缓存）', purpose: 'URL 生成、提交 Google、商品与列表缓存', module: 'SEO 管理 · 技术治理 / 商品管理', status: '部分覆盖', note: 'URL 治理与 sitemap 分片已设计；Google 提交需 API 授权' },
    { file: 'CControllerBF.php', actions: '5 个（同 CController）', purpose: 'CController 的并行/备份版本', module: '同上', status: '待确认', note: '与 CController 是否仍并行运行需业务确认，未合并' },
    { file: 'CartController.php', actions: 'Jump / Send', purpose: '旧站购物车跳转与询盘发送', module: '商城 · 询盘流程', status: '已覆盖', note: '询盘原型含 RequestId、有效性与通知边界' },
    { file: 'CatController.php', actions: 'Img', purpose: '分类图片处理', module: '商城 · 分类管理 / 内容资产', status: '部分覆盖', note: '图片资产管线未设计' },
    { file: 'MapController.php', actions: 'Cha / Index / Robots / ToGoogle / Put', purpose: '站点地图、robots、Google 提交与更新', module: 'SEO 管理 · 技术治理', status: '部分覆盖', note: 'sitemap / robots / 灰度回滚已设计；提交动作未接 API' },
    { file: 'NewsController.php', actions: 'AddTime', purpose: '新闻时间维护', module: '网站基础管理 · 新闻公告', status: '已覆盖', note: '页面编辑支持时间字段（Demo）' },
    { file: 'ProController.php', actions: 'Day / DayAll / ToPro / Put', purpose: '商品日同步、全量同步与发布', module: '商城 · 商品 / 库存', status: '部分覆盖', note: '库存与商品页已设计；WMS/ERP 同步未实现' },
    { file: 'SnSiiController.php', actions: 'init / Lang / seo', purpose: 'SEO 辅助与多语言处理', module: 'SEO 管理 / 多语言', status: '部分覆盖', note: 'hreflang 与语言约束已设计；旧实现逻辑待核对' },
    { file: 'SupplierController.php', actions: 'ProNum', purpose: '供应商商品数量统计', module: '未设计', status: '待确认', note: '供应商维度未进入本轮信息架构，需业务确认' }
  ];


  D.legacyCoverage = [
    { ctrl: 'Default', action: 'actionIndex', fn: '后台默认首页/概览', module: '工作台 · 经营概览', status: '已覆盖', note: 'Dashboard 概览与关键指标' },
    { ctrl: 'Api', action: 'actionPutLogs', fn: '外部日志写入接口', module: '系统管理 · 操作审计', status: '部分覆盖', note: '审计页可见日志；写入接口形态待阶段 1 核实' },
    { ctrl: 'Account', action: 'actionMy', fn: '个人资料', module: '个人账号（顶栏菜单）', status: '已覆盖', note: '账号页展示资料与角色' },
    { ctrl: 'Account', action: 'actionEditPass', fn: '修改密码', module: '个人账号', status: '已覆盖', note: '密码表单为 Demo，不提交' },
    { ctrl: 'Category', action: 'actionIndex', fn: '分类列表/编辑', module: '商城运营 · 分类管理', status: '已覆盖', note: '分类表与编辑弹窗' },
    { ctrl: 'Category', action: 'actionAttr', fn: '分类属性维护', module: '商城运营 · 分类管理', status: '已覆盖', note: '属性抽屉，标注 Ds Bit/人工来源' },
    { ctrl: 'Ad', action: 'actionIndex', fn: '广告列表', module: '营销运营 · 营销活动', status: '部分覆盖', note: '活动表覆盖投放管理，广告位独立字段待确认' },
    { ctrl: 'Ad', action: 'actionAdd', fn: '新增广告', module: '营销运营 · 营销活动', status: '部分覆盖', note: '新建活动弹窗为 Demo' },
    { ctrl: 'Ad', action: 'actionEdit', fn: '编辑广告', module: '营销运营 · 营销活动', status: '部分覆盖', note: '编辑动作待业务确认是否等同' },
    { ctrl: 'Ad', action: 'actionChart', fn: '广告效果图表', module: '营销运营 · 数据分析', status: '已覆盖', note: '渠道表现与漏斗' },
    { ctrl: 'Manage', action: 'actionIndex', fn: '后台账号列表', module: '系统管理 · 用户管理', status: '已覆盖', note: '用户表与角色' },
    { ctrl: 'Manage', action: 'actionAdd', fn: '新增后台账号', module: '系统管理 · 用户管理', status: '已覆盖', note: '邀请用户弹窗（Demo）' },
    { ctrl: 'Manage', action: 'actionEdit', fn: '编辑后台账号', module: '系统管理 · 用户管理', status: '已覆盖', note: '编辑弹窗（Demo）' },
    { ctrl: 'Manage', action: 'actionDelete', fn: '删除后台账号', module: '系统管理 · 用户管理', status: '部分覆盖', note: '停用/删除为 Demo，实际策略待确认' },
    { ctrl: 'Product', action: 'actionIndex', fn: '商品列表/快速编辑', module: '商城运营 · 商品管理', status: '已覆盖', note: '搜索、筛选、批量与行内操作' },
    { ctrl: 'Product', action: 'actionAdd', fn: '新增商品', module: '商城运营 · 商品管理', status: '已覆盖', note: '新增入口为 Demo' },
    { ctrl: 'Product', action: 'actionHot', fn: '设置热门/推荐', module: '商城运营 · 搜索管理', status: '已覆盖', note: '热门推荐 Tab 与加入推荐' },
    { ctrl: 'Product', action: 'actionHotList', fn: '热门商品列表', module: '商城运营 · 搜索管理', status: '已覆盖', note: '热门推荐列表' },
    { ctrl: 'Product', action: 'actionEdit', fn: '编辑商品', module: '商城运营 · 商品详情页管理', status: '已覆盖', note: '详情编辑器 + 预览' },
    { ctrl: 'Help', action: 'actionIndex', fn: '帮助中心列表', module: '商城运营 · 网站基础管理', status: '已覆盖', note: '帮助中心 Tab' },
    { ctrl: 'Help', action: 'actionAdd', fn: '新增帮助条目', module: '网站基础管理', status: '已覆盖', note: '新建按钮（Demo）' },
    { ctrl: 'Help', action: 'actionEdit', fn: '编辑帮助条目', module: '网站基础管理', status: '已覆盖', note: '编辑按钮（Demo）' },
    { ctrl: 'Help', action: 'actionDelete', fn: '删除帮助条目', module: '网站基础管理', status: '部分覆盖', note: '删除策略待业务确认' },
    { ctrl: 'Help', action: 'actionCategory', fn: '帮助分类列表', module: '网站基础管理 · 帮助中心', status: '已覆盖', note: '分类列在表格中' },
    { ctrl: 'Help', action: 'actionCategoryAdd', fn: '新增帮助分类', module: '网站基础管理', status: '部分覆盖', note: '分类新增未单独设计，待确认频率' },
    { ctrl: 'Help', action: 'actionCategoryEdit', fn: '编辑帮助分类', module: '网站基础管理', status: '部分覆盖', note: '同上' },
    { ctrl: 'Help', action: 'actionCategoryDelete', fn: '删除帮助分类', module: '网站基础管理', status: '部分覆盖', note: '删除策略待确认' },
    { ctrl: 'Info', action: 'actionIndex', fn: '信息页列表', module: '网站基础管理 · 信息页', status: '已覆盖', note: '信息页 Tab' },
    { ctrl: 'Info', action: 'actionAdd', fn: '新增信息页', module: '网站基础管理', status: '已覆盖', note: '新建按钮（Demo）' },
    { ctrl: 'Info', action: 'actionEdit', fn: '编辑信息页', module: '网站基础管理', status: '已覆盖', note: '编辑按钮（Demo）' },
    { ctrl: 'Info', action: 'actionDelete', fn: '删除信息页', module: '网站基础管理', status: '部分覆盖', note: '删除策略待确认' },
    { ctrl: 'Info', action: 'actionCategory', fn: '信息页分类', module: '网站基础管理', status: '已覆盖', note: '分类列在表格中' },
    { ctrl: 'Info', action: 'actionCategoryAdd', fn: '新增信息分类', module: '网站基础管理', status: '部分覆盖', note: '未单独设计，待确认' },
    { ctrl: 'Info', action: 'actionCategoryEdit', fn: '编辑信息分类', module: '网站基础管理', status: '部分覆盖', note: '同上' },
    { ctrl: 'Info', action: 'actionCategoryDelete', fn: '删除信息分类', module: '网站基础管理', status: '部分覆盖', note: '同上' },
    { ctrl: 'News', action: 'actionIndex', fn: '新闻列表', module: '内容资产库 / 网站基础管理', status: '已覆盖', note: '内容资产库含新闻公告类型' },
    { ctrl: 'News', action: 'actionAdd', fn: '新增新闻', module: '内容资产库', status: '已覆盖', note: '新建内容弹窗' },
    { ctrl: 'News', action: 'actionEdit', fn: '编辑新闻', module: '内容资产库', status: '已覆盖', note: '编辑抽屉（Demo）' },
    { ctrl: 'News', action: 'actionDelete', fn: '删除新闻', module: '内容资产库', status: '部分覆盖', note: '删除策略待确认' },
    { ctrl: 'News', action: 'actionCategory', fn: '新闻分类', module: '网站基础管理', status: '部分覆盖', note: '新闻分类 Tab 未单独展开' },
    { ctrl: 'News', action: 'actionCategoryAdd', fn: '新增新闻分类', module: '网站基础管理', status: '部分覆盖', note: '同上' },
    { ctrl: 'News', action: 'actionCategoryEdit', fn: '编辑新闻分类', module: '网站基础管理', status: '部分覆盖', note: '同上' },
    { ctrl: 'News', action: 'actionCategoryDelete', fn: '删除新闻分类', module: '网站基础管理', status: '部分覆盖', note: '同上' }
  ];

  /* ------------------------------------------------------------------ 站点基础 */
  D.sitePages = {
    help: [
      { title: 'How to request a quote', category: '询盘与报价', lang: 'EN', status: 'Published', updated: '2026-11-10' },
      { title: 'Shipping and lead times', category: '物流与交期', lang: 'EN', status: 'Published', updated: '2026-11-08' },
      { title: 'Datasheet sources and verification', category: '技术资料', lang: 'EN', status: 'Published', updated: '2026-11-05' },
      { title: 'Payment methods and invoicing', category: '付款', lang: 'EN', status: 'Draft', updated: '2026-11-12' }
    ],
    info: [
      { title: 'About Morris Electronic', category: '公司信息', lang: 'EN', status: 'Published', updated: '2026-10-28' },
      { title: 'Quality and compliance', category: '质量与合规', lang: 'EN', status: 'Published', updated: '2026-10-20' },
      { title: 'Privacy policy', category: '法务', lang: 'EN', status: 'Published', updated: '2026-09-30' }
    ],
    news: [
      { title: '2026 Q4 product and lead-time update', category: '公司动态', lang: 'EN', status: 'Published', updated: '2026-11-13' },
      { title: 'Hong Kong warehouse holiday schedule', category: '物流公告', lang: 'EN', status: 'Scheduled', updated: '2026-11-11' },
      { title: 'Ds Bit evidence chain upgrade', category: '技术公告', lang: 'EN', status: 'Draft', updated: '2026-11-09' }
    ]
  };

  /* ------------------------------------------------------------------ 业务链路 */
  D.flows = [
    {
      id: 'A', name: '产品数据驱动商品详情页',
      steps: ['Ds Bit 解析 Datasheet', '参数标准化', '证据校验', '人工审核', '详情页使用', '商品页面发布'],
      boundary: '只有 Verified 参数可进入详情页；Needs Review / Rejected 不得伪装为事实。'
    },
    {
      id: 'B', name: '产品知识驱动 SEO / GEO',
      steps: ['已审核产品知识', 'SEO / GEO 内容生成', '人工审核', '发布到商品页或内容页', 'Search Console / GA4 追踪'],
      boundary: '内容生成异步运行；Search Console / GA4 当前未连接，原型数据为 Demo。'
    },
    {
      id: 'C', name: '产品知识驱动社媒与视频',
      steps: ['已审核产品知识', '生成选题', '平台适配内容', '人工审核', '定时发布', '统计引流'],
      boundary: '社媒发布接口未连接；发布失败不影响商品详情与询盘。'
    },
    {
      id: 'D', name: '营销数据驱动询盘',
      steps: ['社媒 / 搜索 / 视频', 'UTM 链接', '商品详情页', '询盘提交', 'GA4 事件', '询盘后台', '有效询盘分析'],
      boundary: 'UTM 与 GA4 事件为设计口径；实际归因需接入后验证。'
    }
  ];

  /* ------------------------------------------------------------------ 稳定性原则 */
  D.stability = [
    { k: 'Ds Bit 独立运行', v: '解析引擎与商城后台分属两个系统边界，原型只设计管理入口。', status: 'Design' },
    { k: '商品站只读已审核数据', v: 'Needs Review / Rejected 参数不进入商品详情与营销内容。', status: 'Design' },
    { k: 'SEO / GEO 异步生成', v: '内容生成以任务方式排队，不阻塞商品浏览与询盘。', status: 'Design' },
    { k: '社媒独立任务队列', v: '发布失败进入重试队列，不反向影响商品数据。', status: 'Demo' },
    { k: '视频独立媒体处理', v: '视频转码/封面处理使用独立任务，不与内容发布耦合。', status: 'Design' },
    { k: '营销失败不影响交易', v: '营销任务失败不影响商品详情、库存展示与询盘提交。', status: 'Design' },
    { k: '版本与回滚', v: '产品知识与内容均保留版本记录，支持回滚草稿。', status: 'Demo' },
    { k: '事实与营销内容隔离', v: '商品事实字段与营销文案分表/分权限维护，互不覆盖。', status: 'Design' }
  ];

  window.ADMIN_DATA = D;
})();
