// Demos for the `slider` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'slider-1': sliderBasic,
  'slider-2': sliderStepped,
  'slider-3': sliderRange,
};

const copy = <String, Map<String, String>>{
  'volume': {'fa-IR': 'بلندی صدا', 'en-US': 'Volume'},
  'percent': {'fa-IR': 'درصد', 'en-US': 'percent'},
  'guests': {'fa-IR': 'تعداد مهمان', 'en-US': 'Number of guests'},
  'people': {'fa-IR': 'نفر', 'en-US': 'people'},
  'guestsHint': {
    'fa-IR': 'بیش از ده نفر را تلفنی هماهنگ کنید.',
    'en-US': 'For more than ten, please call us.',
  },
  'priceRange': {'fa-IR': 'بازهٔ قیمت', 'en-US': 'Price range'},
  'lowestPrice': {'fa-IR': 'کمترین قیمت', 'en-US': 'Lowest price'},
  'highestPrice': {'fa-IR': 'بیشترین قیمت', 'en-US': 'Highest price'},
  'toman': {'fa-IR': 'تومان', 'en-US': 'toman'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'slider-1': {
    'title': {'fa-IR': 'لغزنده', 'en-US': 'Slider'},
    'description': {
      'fa-IR': 'valueLabel اجباری است: عدد خام یک نام نیست، «چهل درصد» هست.',
      'en-US': 'valueLabel is required: a raw number is not a name, «forty percent» is.',
    },
  },
  'slider-2': {
    'title': {'fa-IR': 'با گام و بازهٔ دلخواه', 'en-US': 'Stepped, custom range'},
    'description': {
      'fa-IR': 'min، max و step بازه را می‌سازند؛ عددها از formatNumber می‌گذرند.',
      'en-US': 'min, max and step build the range; the numbers go through formatNumber.',
    },
  },
  'slider-3': {
    'title': {'fa-IR': 'لغزندهٔ بازه‌ای', 'en-US': 'Range slider'},
    'description': {
      'fa-IR': 'دو دستگیره، دو نام: startLabel و endLabel هرکدام یک سرِ بازه را می‌نامند.',
      'en-US': 'Two thumbs, two names: startLabel and endLabel name each end of the range.',
    },
  },
};

Widget sliderBasic(BuildContext context) => const _SliderBasic();

class _SliderBasic extends StatefulWidget {
  const _SliderBasic();
  @override
  State<_SliderBasic> createState() => _SliderBasicState();
}

class _SliderBasicState extends State<_SliderBasic> {
  double _volume = 0.4;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN slider-1
    return LumoSlider(
      label: t['volume'],
      value: _volume,
      valueLabel: (v) =>
          '${formatNumber((v * 100).round(), LumoScope.of(context).locale)} ${t['percent']}',
      onChanged: (next) => setState(() => _volume = next),
    );
    // END slider-1
  }
}

Widget sliderStepped(BuildContext context) => const _SliderStepped();

class _SliderStepped extends StatefulWidget {
  const _SliderStepped();
  @override
  State<_SliderStepped> createState() => _SliderSteppedState();
}

class _SliderSteppedState extends State<_SliderStepped> {
  double _people = 4;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN slider-2
    return LumoSlider(
      label: t['guests'],
      value: _people,
      min: 1,
      max: 10,
      step: 1,
      valueLabel: (v) =>
          '${formatNumber(v.round(), LumoScope.of(context).locale)} ${t['people']}',
      description: t['guestsHint'],
      onChanged: (next) => setState(() => _people = next),
    );
    // END slider-2
  }
}

Widget sliderRange(BuildContext context) => const _SliderRange();

class _SliderRange extends StatefulWidget {
  const _SliderRange();
  @override
  State<_SliderRange> createState() => _SliderRangeState();
}

class _SliderRangeState extends State<_SliderRange> {
  RangeValues _price = const RangeValues(200000, 800000);

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN slider-3
    return LumoRangeSlider(
      label: t['priceRange'],
      startLabel: t['lowestPrice'],
      endLabel: t['highestPrice'],
      values: _price,
      min: 0,
      max: 1000000,
      step: 50000,
      valueLabel: (v) =>
          '${formatNumber(v.round(), LumoScope.of(context).locale)} ${t['toman']}',
      onChanged: (next) => setState(() => _price = next),
    );
    // END slider-3
  }
}
