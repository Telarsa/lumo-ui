// Demos for the `file-upload` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'file-upload-1': fileUploadEmpty,
  'file-upload-2': fileUploadWithFiles,
};

const copy = <String, Map<String, String>>{
  'idDocuments': {'fa-IR': 'مدارک هویتی', 'en-US': 'Identity documents'},
  'idDocumentsHint': {
    'fa-IR': 'تصویر پشت و روی کارت ملی، هرکدام کمتر از ۵ مگابایت.',
    'en-US': 'Both sides of your ID card, each under five megabytes.',
  },
  'browse': {'fa-IR': 'انتخاب پرونده', 'en-US': 'Choose a file'},
  'attachments': {'fa-IR': 'پیوست‌های درخواست', 'en-US': 'Request attachments'},
  'addFile': {'fa-IR': 'افزودن پرونده', 'en-US': 'Add a file'},
  'remove': {'fa-IR': 'حذف', 'en-US': 'Remove'},
  'maxFiles': {'fa-IR': 'حداکثر ۵ پرونده', 'en-US': 'Up to 5 files'},
  'contractName': {'fa-IR': 'قرارداد.pdf', 'en-US': 'contract.pdf'},
  'contractSize': {'fa-IR': '۱٫۲ مگابایت', 'en-US': '1.2 MB'},
  'cardImageName': {'fa-IR': 'تصویر-کارت.jpg', 'en-US': 'card-photo.jpg'},
  'cardImageSize': {'fa-IR': '۸۴۰ کیلوبایت', 'en-US': '840 KB'},
  'uploading': {'fa-IR': 'در حال بارگذاری', 'en-US': 'Uploading'},
  'fortyFivePercent': {'fa-IR': '۴۵ درصد', 'en-US': '45 percent'},
  'payslipName': {'fa-IR': 'فیش-حقوقی.png', 'en-US': 'payslip.png'},
  'failed': {'fa-IR': 'ناموفق', 'en-US': 'Failed'},
  'tooLarge': {
    'fa-IR': 'حجم پرونده بیش از ۵ مگابایت است.',
    'en-US': 'The file is larger than five megabytes.',
  },
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'file-upload-1': {
    'title': {'fa-IR': 'بارگذاری پرونده', 'en-US': 'File upload'},
    'description': {
      'fa-IR': 'browseLabel نام دکمهٔ انتخاب پرونده است و اجباری؛ کادر خط‌چین خودش کنترل نیست.',
      'en-US': 'browseLabel names the browse button and is required; the dashed frame is not itself a control.',
    },
  },
  'file-upload-2': {
    'title': {'fa-IR': 'با پرونده‌ها و وضعیت', 'en-US': 'With files and states'},
    'description': {
      'fa-IR': 'هر وضعیتی جز done یک statusLabel می‌خواهد — وضعیت باید به کلمه گفته شود، نه با نوار.',
      'en-US': 'Every state but done needs a statusLabel — the state must be said in words, not drawn as a bar.',
    },
  },
};

Widget fileUploadEmpty(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN file-upload-1
  return LumoFileUpload(
    label: t['idDocuments'],
    description: t['idDocumentsHint'],
    browseLabel: t['browse'],
    onBrowse: () {},
    files: const <LumoAttachment>[],
    isDisabled: false,
  );
  // END file-upload-1
}

Widget fileUploadWithFiles(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN file-upload-2
  return LumoFileUpload(
    label: t['attachments'],
    browseLabel: t['addFile'],
    onBrowse: () {},
    onRemove: (index) {},
    removeLabel: (name) => '${t['remove']} $name',
    maxFilesLabel: t['maxFiles'],
    files: [
      LumoAttachment(name: t['contractName'], sizeLabel: t['contractSize']),
      LumoAttachment(
        name: t['cardImageName'],
        sizeLabel: t['cardImageSize'],
        status: LumoAttachmentStatus.uploading,
        statusLabel: t['uploading'],
        progress: 0.45,
        progressLabel: t['fortyFivePercent'],
      ),
      LumoAttachment(
        name: t['payslipName'],
        status: LumoAttachmentStatus.failed,
        statusLabel: t['failed'],
        errorMessage: t['tooLarge'],
      ),
    ],
  );
  // END file-upload-2
}
