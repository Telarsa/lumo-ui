// Demos for the `carousel` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'carousel-1': carouselBasic,
  'carousel-2': carouselAutoPlay,
};

const copy = <String, Map<String, String>>{
  'specialOffers': {'fa-IR': 'پیشنهادهای ویژه', 'en-US': 'Special offers'},
  'previousSlide': {'fa-IR': 'اسلاید پیش', 'en-US': 'Previous slide'},
  'nextSlide': {'fa-IR': 'اسلاید بعد', 'en-US': 'Next slide'},
  'slide': {'fa-IR': 'اسلاید', 'en-US': 'Slide'},
  'of': {'fa-IR': 'از', 'en-US': 'of'},
  'autumnSale': {'fa-IR': 'تخفیف پاییزی', 'en-US': 'Autumn sale'},
  'freeShipping': {'fa-IR': 'ارسال رایگان', 'en-US': 'Free shipping'},
  'newArrivals': {'fa-IR': 'کالای نو', 'en-US': 'New arrivals'},
  'gettingStarted': {'fa-IR': 'راهنمای نخستین استفاده', 'en-US': 'Getting started'},
  'previousStep': {'fa-IR': 'گام پیش', 'en-US': 'Previous step'},
  'nextStep': {'fa-IR': 'گام بعد', 'en-US': 'Next step'},
  'step': {'fa-IR': 'گام', 'en-US': 'Step'},
  'completeProfile': {'fa-IR': 'نمایه‌تان را کامل کنید', 'en-US': 'Complete your profile'},
  'firstProject': {'fa-IR': 'نخستین پروژه را بسازید', 'en-US': 'Make your first project'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'carousel-1': {
    'title': {'fa-IR': 'چرخ‌فلک', 'en-US': 'Carousel'},
    'description': {
      'fa-IR': 'slideLabel نام هر اسلاید را از شماره‌اش می‌سازد؛ پیمایش روی محور خواندن است.',
      'en-US': 'slideLabel builds each slide’s name from its position; the travel is along the reading axis.',
    },
  },
  'carousel-2': {
    'title': {'fa-IR': 'پخش خودکار', 'en-US': 'Auto-play'},
    'description': {
      'fa-IR': 'autoPlay با interval پیش می‌رود؛ دکمه‌های پیش و پس همیشه هستند و هرکدام نام خود را دارند.',
      'en-US': 'autoPlay advances on the interval; the previous and next controls are always there, each with its own name.',
    },
  },
};

Widget _slide(String title, Color colour) => DecoratedBox(
  decoration: BoxDecoration(
    color: colour,
    borderRadius: BorderRadius.circular(12),
  ),
  child: Center(child: Text(title)),
);

Widget carouselBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN carousel-1
  return LumoCarousel(
    label: t['specialOffers'],
    previousLabel: t['previousSlide'],
    nextLabel: t['nextSlide'],
    slideLabel: (index, count) =>
        // formatNumber, not `$index`: a bare int interpolates as a LATIN digit,
        // and this string is ANNOUNCED — a Persian reader would hear "اسلاید 1".
        '${t['slide']} ${formatNumber(index + 1, t.locale)} ${t['of']} ${formatNumber(count, t.locale)}',
    height: 160,
    items: [
      _slide(t['autumnSale'], const Color(0xFFFDE68A)),
      _slide(t['freeShipping'], const Color(0xFFBFDBFE)),
      _slide(t['newArrivals'], const Color(0xFFBBF7D0)),
    ],
  );
  // END carousel-1
}

Widget carouselAutoPlay(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN carousel-2
  return LumoCarousel(
    label: t['gettingStarted'],
    previousLabel: t['previousStep'],
    nextLabel: t['nextStep'],
    slideLabel: (index, count) =>
        '${t['step']} ${formatNumber(index + 1, t.locale)} ${t['of']} ${formatNumber(count, t.locale)}',
    autoPlay: true,
    interval: const Duration(seconds: 4),
    showDots: true,
    height: 140,
    onIndexChanged: (index) {},
    items: [
      _slide(t['completeProfile'], const Color(0xFFE9D5FF)),
      _slide(t['firstProject'], const Color(0xFFFECACA)),
    ],
  );
  // END carousel-2
}
