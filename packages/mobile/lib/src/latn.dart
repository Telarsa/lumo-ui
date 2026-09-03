/// Marks a subtree whose Latin digits are correct, as `data-lumo-latn` does on
/// the web. Put it on a `Semantics(identifier:)` around the widget:
///
/// ```dart
/// Semantics(identifier: kLumoLatnIsland, child: TextFormField(…))
/// ```
///
/// The case it exists for is the same on both platforms: a numeric ENTRY field
/// holds ASCII because the thing that parses it requires ASCII. The web can
/// infer this from `input[type=number]`, which the HTML spec defines as an
/// ASCII floating-point value; a Flutter semantics node carries no keyboard
/// type, so here the app declares it. A fitness app's height and birth-year
/// fields are the ones that found this — «۱۷۸» is not something `double.tryParse` can
/// read, so a field that shaped its own digits would silently refuse the user's
/// input.
///
/// It is a NARROW exemption on purpose: it suppresses digit rules and nothing
/// else, and only for the value, never the label. An island that hides a
/// missing name is a bug wearing a permission slip, and
/// `semantics_grader_test.dart` holds that line with a fixture.
///
/// This lives in the shipped library rather than in `testing.dart` because the
/// app that declares an island is production code, and production code has no
/// business importing a test support library to name a constant.
const kLumoLatnIsland = 'lumo-latn';
