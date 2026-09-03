/// The app's own strings, in the two languages it ships.
///
/// Hand-written rather than generated: this app exists to exercise Lumo, and a
/// `.arb` pipeline would add a build step to a repository that has enough of
/// them. What matters for the grader is that every announced string comes from
/// HERE and none from a widget's default — an English word that reaches a
/// Persian screen from `MaterialLocalizations` is exactly what `engine-english`
/// is for, and the way to find it is to have no English of one's own.
class Strings {
  const Strings({
    required this.title,
    required this.subtitle,
    required this.appointmentOn,
    required this.earlier,
    required this.later,
    required this.durationLabel,
    required this.durationUnit,
    required this.heightLabel,
    required this.heightUnit,
    required this.remindMe,
    required this.remindMeOn,
    required this.remindMeOff,
    required this.confirm,
    required this.cancel,
    required this.confirmed,
    required this.dismiss,
    required this.history,
    required this.visits,
    required this.priceLabel,
    required this.currency,
    required this.language,
  });

  final String title;
  final String subtitle;
  final String appointmentOn;
  final String earlier;
  final String later;
  final String durationLabel;
  final String durationUnit;
  final String heightLabel;
  final String heightUnit;
  final String remindMe;
  final String remindMeOn;
  final String remindMeOff;
  final String confirm;
  final String cancel;
  final String confirmed;
  final String dismiss;
  final String history;
  final String visits;
  final String priceLabel;
  final String currency;
  final String language;

  static const fa = Strings(
    title: 'نوبت درمانگاه',
    subtitle: 'زمان و مدت مراجعهٔ خود را انتخاب کنید.',
    appointmentOn: 'تاریخ نوبت',
    earlier: 'روز قبل',
    later: 'روز بعد',
    durationLabel: 'مدت مراجعه',
    durationUnit: 'دقیقه',
    heightLabel: 'قد',
    heightUnit: 'سانتی‌متر',
    remindMe: 'یادآوری',
    remindMeOn: 'یادآوری روشن است',
    remindMeOff: 'یادآوری خاموش است',
    confirm: 'ثبت نوبت',
    cancel: 'انصراف',
    confirmed: 'نوبت شما ثبت شد',
    dismiss: 'بستن',
    history: 'مراجعه‌های پیشین',
    visits: 'مراجعه',
    priceLabel: 'هزینه',
    currency: 'تومان',
    language: 'زبان',
  );

  static const en = Strings(
    title: 'Clinic appointment',
    subtitle: 'Choose when to come in, and for how long.',
    appointmentOn: 'Appointment date',
    earlier: 'Previous day',
    later: 'Next day',
    durationLabel: 'Visit length',
    durationUnit: 'minutes',
    heightLabel: 'Height',
    heightUnit: 'cm',
    remindMe: 'Remind me',
    remindMeOn: 'Reminder is on',
    remindMeOff: 'Reminder is off',
    confirm: 'Book appointment',
    cancel: 'Discard',
    confirmed: 'Your appointment is booked',
    dismiss: 'Close',
    history: 'Previous visits',
    visits: 'visits',
    priceLabel: 'Fee',
    currency: 'toman',
    language: 'Language',
  );

  static Strings of(String locale) => locale.startsWith('fa') ? fa : en;
}
