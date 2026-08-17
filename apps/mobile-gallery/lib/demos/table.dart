// Demos for the `table` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'table-1': tableBasic,
};

const copy = <String, Map<String, String>>{
  'recentOrders': {'fa-IR': 'سفارش‌های اخیر', 'en-US': 'Recent orders'},
  'order': {'fa-IR': 'سفارش', 'en-US': 'Order'},
  'status': {'fa-IR': 'وضعیت', 'en-US': 'Status'},
  'total': {'fa-IR': 'مبلغ', 'en-US': 'Total'},
  'caption': {'fa-IR': 'سه سفارش آخر این هفته.', 'en-US': 'The last three orders this week.'},
  'o1': {'fa-IR': '۱۴۰۵۰۳۲۱', 'en-US': '14050321'},
  'o2': {'fa-IR': '۱۴۰۵۰۳۱۹', 'en-US': '14050319'},
  'o3': {'fa-IR': '۱۴۰۵۰۳۱۲', 'en-US': '14050312'},
  'sent': {'fa-IR': 'ارسال‌شده', 'en-US': 'Sent'},
  'packing': {'fa-IR': 'بسته‌بندی', 'en-US': 'Packing'},
  'delivered': {'fa-IR': 'تحویل‌شده', 'en-US': 'Delivered'},
  't1': {'fa-IR': '۲۴۰٬۰۰۰', 'en-US': '240,000'},
  't2': {'fa-IR': '۸۵٬۵۰۰', 'en-US': '85,500'},
  't3': {'fa-IR': '۱٬۲۰۰٬۰۰۰', 'en-US': '1,200,000'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'table-1': {
    'title': {'fa-IR': 'جدول داده', 'en-US': 'A data table'},
    'description': {
      'fa-IR':
          'هر سلول رشته‌ای است که از پیش قالب‌بندی شده — جدول عدد خام نمی‌گیرد. ستون مبلغ عددی است، پس رقم‌هایش چپ‌به‌راست می‌مانند.',
      'en-US':
          'Every cell is a string already formatted — the table never takes a raw number. The total column is numeric, so its digits stay LTR.',
    },
  },
};

Widget tableBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN table-1
  return LumoTable(
    label: t['recentOrders'],
    caption: t['caption'],
    columns: [
      LumoTableColumn(id: 'order', header: t['order']),
      LumoTableColumn(id: 'status', header: t['status']),
      LumoTableColumn(id: 'total', header: t['total'], isNumeric: true, align: LumoTableAlign.end),
    ],
    rows: [
      LumoTableRowData(id: '1', cells: [LumoTableCell(t['o1']), LumoTableCell(t['sent']), LumoTableCell(t['t1'])]),
      LumoTableRowData(id: '2', cells: [LumoTableCell(t['o2']), LumoTableCell(t['packing']), LumoTableCell(t['t2'])]),
      LumoTableRowData(id: '3', cells: [LumoTableCell(t['o3']), LumoTableCell(t['delivered']), LumoTableCell(t['t3'])]),
    ],
  );
  // END table-1
}
