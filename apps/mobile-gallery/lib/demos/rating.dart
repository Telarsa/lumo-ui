// Demos for the `rating` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'rating-1': ratingReadOnly,
  'rating-2': ratingInteractive,
};

const copy = <String, Map<String, String>>{
  'productRating': {'fa-IR': 'امتیاز این محصول', 'en-US': 'This product’s rating'},
  'fourOfFive': {'fa-IR': '۴ از ۵ ستاره', 'en-US': '4 out of 5 stars'},
  'rateThisOrder': {'fa-IR': 'به این سفارش امتیاز بدهید', 'en-US': 'Rate this order'},
  'outOfFiveStars': {'fa-IR': 'از ۵ ستاره', 'en-US': 'out of 5 stars'},
  'stars': {'fa-IR': 'ستاره', 'en-US': 'stars'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'rating-1': {
    'title': {'fa-IR': 'امتیاز خواندنی', 'en-US': 'Read-only rating'},
    'description': {
      'fa-IR': 'بدون onChanged یک عدد است، نه یک کنترل. valueLabel همان عدد را به کلمه می‌گوید.',
      'en-US': 'Without onChanged it is a number, not a control. valueLabel says that number in words.',
    },
  },
  'rating-2': {
    'title': {'fa-IR': 'امتیازدهی', 'en-US': 'Interactive'},
    'description': {
      'fa-IR': 'onChanged آن را به کنترل تبدیل می‌کند و آن‌گاه starLabel نام هر ستاره را می‌سازد.',
      'en-US': 'onChanged turns it into a control, and then starLabel names each star.',
    },
  },
};

Widget ratingReadOnly(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN rating-1
  return LumoRating(
    label: t['productRating'],
    value: 4,
    valueLabel: t['fourOfFive'],
  );
  // END rating-1
}

Widget ratingInteractive(BuildContext context) => const _RatingInteractive();

class _RatingInteractive extends StatefulWidget {
  const _RatingInteractive();
  @override
  State<_RatingInteractive> createState() => _RatingInteractiveState();
}

class _RatingInteractiveState extends State<_RatingInteractive> {
  double _score = 3;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN rating-2
    return LumoRating(
      label: t['rateThisOrder'],
      size: LumoRatingSize.lg,
      value: _score,
      valueLabel:
          '${formatNumber(_score.round(), LumoScope.of(context).locale)} ${t['outOfFiveStars']}',
      starLabel: (position) =>
          '${formatNumber(position, LumoScope.of(context).locale)} ${t['stars']}',
      onChanged: (next) => setState(() => _score = next),
    );
    // END rating-2
  }
}
