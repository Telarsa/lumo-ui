import 'package:flutter/material.dart';

import 'alert.dart';
import 'format.dart';
import 'layout.dart';
import 'scope.dart';

/// One rule over one field's value: the message to announce, or `null` when
/// the value passes. SYNCHRONOUS and supplied by the app — the web's
/// `form-state.tsx` reaches for TanStack Form and Standard Schema because a
/// browser form has async, server and schema validation to reconcile; a phone
/// form's rules are `if` statements, and inventing a schema language here
/// would be a second way to say what Dart already says.
///
/// The MESSAGE is the app's prose, always: nothing in this file can author a
/// sentence in the reader's language, so nothing in this file tries.
typedef LumoFieldValidator<T> = String? Function(T value);

/// One registered field, in the order it was declared.
class _Field {
  _Field({required this.name, required this.label, required this.focusNode, required this.validate, required this.value});
  final String name;
  final String label;
  final FocusNode focusNode;
  final String? Function(Object? value) validate;
  Object? value;
  String? error;
}

/// The state of one form: the values, the rules, the errors, and the ORDER the
/// fields were declared in — which is the order a failed submit walks to find
/// the first invalid one.
///
/// It is a plain `ChangeNotifier` the app owns and disposes, like a
/// `TextEditingController`: created in `initState`, handed to [LumoForm], read
/// by anything that needs a value. It holds no `BuildContext`, renders nothing
/// and speaks no language.
///
///     final form = LumoFormState();
///     …
///     LumoButton(
///       onPressed: () { if (form.submit()) save(form.values); },
///       child: const Text('ثبت'),
///     )
class LumoFormState extends ChangeNotifier {
  /// Insertion-ordered: a Dart `Map` keeps the order keys were first added, and
  /// that order is the order the fields registered, which is the order they
  /// appear in the tree.
  final Map<String, _Field> _fields = <String, _Field>{};

  bool _isSubmitted = false;

  /// Whether [submit] has run at least once. Before it has, a field that has
  /// never been touched shows no error — the same reason the web gates the
  /// message on `isBlurred` rather than `isTouched`.
  bool get isSubmitted => _isSubmitted;

  /// Every field's current value, by name.
  Map<String, Object?> get values => {for (final f in _fields.values) f.name: f.value};

  /// One field's value, typed. `null` when no such field is registered.
  T? valueOf<T>(String name) => _fields[name]?.value as T?;

  /// One field's current error, or `null`. This is the string the field's own
  /// control must carry as its `errorMessage:` — see [LumoFormField].
  String? errorOf(String name) => _fields[name]?.error;

  /// The focus node the field registered, so the app can move focus itself.
  FocusNode? focusNodeOf(String name) => _fields[name]?.focusNode;

  /// The names of the invalid fields, in declaration order.
  List<String> get invalidFields => [for (final f in _fields.values) if (f.error != null) f.name];

  /// How many fields currently hold an error — the number the submit summary
  /// announces (through `formatNumber`, in [LumoForm]).
  int get errorCount => invalidFields.length;

  /// True when no field currently holds an error. Says nothing about fields
  /// that have not been validated yet; [validate] is what decides.
  bool get isValid => errorCount == 0;

  void _register({required String name, required String label, required FocusNode focusNode, required Object? initialValue, required String? Function(Object?) validate}) {
    final existing = _fields[name];
    _fields[name] = _Field(
      name: name,
      label: label,
      focusNode: focusNode,
      validate: validate,
      // A rebuild must not throw away what the reader has typed.
      value: existing == null ? initialValue : existing.value,
    )..error = existing?.error;
  }

  void _unregister(String name, FocusNode focusNode) {
    // Only if this field still owns the slot: a name reused by a replacement
    // widget registers before the old one is disposed.
    if (identical(_fields[name]?.focusNode, focusNode)) _fields.remove(name);
  }

  /// Records a new value. Once a submit has been rejected — or once this field
  /// already carries an error — the field REVALIDATES as it changes, so a
  /// correction clears the message immediately instead of waiting for the next
  /// submit. Before that first rejection nothing validates on keystrokes, which
  /// is what stops a message appearing under a field the reader is still filling.
  void setValue(String name, Object? value) {
    final field = _fields[name];
    if (field == null) return;
    field.value = value;
    if (_isSubmitted || field.error != null) field.error = field.validate(value);
    notifyListeners();
  }

  /// Runs every rule over every field and records the messages. Returns whether
  /// they all passed. Does not move focus and does not mark the form submitted.
  bool validate() {
    for (final field in _fields.values) {
      field.error = field.validate(field.value);
    }
    notifyListeners();
    return isValid;
  }

  /// Messages that came from somewhere this form cannot see — a server's
  /// answer, a cross-field rule the app ran itself. Keys are field names;
  /// an unknown name is ignored. Marks the form submitted, so [LumoForm]
  /// announces the summary for these exactly as it does for its own.
  void setErrors(Map<String, String> errors) {
    for (final field in _fields.values) {
      final message = errors[field.name];
      if (message != null) field.error = message;
    }
    _isSubmitted = true;
    _focusFirstInvalid();
    notifyListeners();
  }

  /// Validate, then answer. On failure two things happen, and they are the
  /// whole point of this class:
  ///
  ///  1. focus moves to the FIRST invalid field in declaration order — not the
  ///     first on screen, which under RTL is a different field, and not
  ///     nowhere, which is where a phone leaves the reader when a form at the
  ///     bottom of a scroll view rejects a field at the top;
  ///  2. [LumoForm] draws and ANNOUNCES the summary, because a message that
  ///     scrolled off the screen was never delivered.
  ///
  /// Returns true when the form is valid, so the caller's success path is a
  /// plain `if`.
  bool submit() {
    _isSubmitted = true;
    final ok = validate();
    if (!ok) _focusFirstInvalid();
    notifyListeners();
    return ok;
  }

  /// Clears every error and forgets the submit — the values stay. Use it when
  /// a form is reopened rather than rebuilt.
  void reset() {
    _isSubmitted = false;
    for (final field in _fields.values) {
      field.error = null;
    }
    notifyListeners();
  }

  void _focusFirstInvalid() {
    for (final field in _fields.values) {
      if (field.error == null) continue;
      field.focusNode.requestFocus();
      return;
    }
  }
}

/// Publishes the form's state to the [LumoFormField]s under it.
class _LumoFormScope extends InheritedWidget {
  const _LumoFormScope({required this.state, required super.child});
  final LumoFormState state;

  @override
  bool updateShouldNotify(_LumoFormScope old) => !identical(old.state, state);
}

/// A form: the fields, and the ONE thing a phone form must not get wrong — what
/// happens when a submit is rejected.
///
/// Mirrors `packages/ui/src/form.tsx` + `form-state.tsx`, and carries across
/// exactly the parts that are contract rather than plumbing. The web's `Field`
/// mints ids and wires `aria-describedby`/`aria-invalid` into the first byte;
/// **Flutter has no `aria-describedby`**, so the binding is different in
/// mechanism and identical in effect: a field's error goes into that field's
/// OWN semantics `hint`, which is what `text_field.dart` already does with its
/// `errorMessage:` — so [LumoFormField] hands the message to the control and
/// the control carries it. A message drawn beside a control, in a `Text` of its
/// own, is announced by nothing when the reader is on the field; that is the
/// defect the web file's whole wiring layer exists to prevent, and it is the
/// same defect here.
///
/// `errorSummaryLabel` is REQUIRED and is a FUNCTION of the already-formatted
/// count, because «۳ فیلد را کامل کنید» is not English with the words swapped —
/// the same shape as `LumoMultiSelect.countLabel`. The count goes through
/// `formatNumber`, so it is «۳» under `fa-IR` and «3» under `en-US`; a bare
/// number never reaches the screen.
///
/// The summary is a `LumoAlert(isLive: true)`: it is INSERTED by the rejected
/// submit, which is precisely the case `alert.dart` says the live flag is for.
///
/// What the web has and this does not: `validationBehavior: "aria" | "native"`
/// (there is no browser constraint validation to switch off — no engine here
/// authors a message in its own language, which is the whole reason that prop
/// exists), async and Standard Schema validators (see [LumoFieldValidator]),
/// and `name`/hidden inputs (nothing is posted by the platform; the app reads
/// [LumoFormState.values]).
class LumoForm extends StatelessWidget {
  const LumoForm({super.key, required this.state, required this.errorSummaryLabel, required this.children, this.gap = LumoGap.md});

  /// The state this form renders. The app owns and disposes it.
  final LumoFormState state;

  /// Builds the announced summary from the ALREADY FORMATTED number of fields
  /// that failed («۳»). REQUIRED — a bare count announces nothing, and a
  /// default would be English.
  final String Function(String count) errorSummaryLabel;

  /// The fields and everything between them, in reading order — which is also
  /// the order a rejected submit walks to find the first invalid field.
  final List<Widget> children;

  /// The step between the children, from the shared scale.
  final LumoGap gap;

  /// The state of the nearest enclosing [LumoForm].
  static LumoFormState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<_LumoFormScope>();
    assert(scope != null, 'A LumoFormField was built outside a LumoForm.');
    return scope!.state;
  }

  @override
  Widget build(BuildContext context) {
    final locale = LumoScope.of(context).locale;
    return _LumoFormScope(
      state: state,
      child: ListenableBuilder(
        listenable: state,
        builder: (context, _) {
          final failed = state.isSubmitted && state.errorCount > 0;
          return LumoStack(
            gap: gap,
            children: [
              if (failed)
                LumoAlert(
                  // The number of fields, in the reader's digits, inside the
                  // caller's sentence. Announced when it appears, and again
                  // when the count changes.
                  title: errorSummaryLabel(formatNumber(state.errorCount, locale)),
                  tone: LumoAlertTone.critical,
                  isLive: true,
                ),
              ...children,
            ],
          );
        },
      ),
    );
  }
}

/// What one field hands its control. Everything the control needs and nothing
/// it does not: no form, no state object, no way to reach a sibling.
class LumoFieldState<T> {
  const LumoFieldState({required this.name, required this.label, required this.value, required this.errorMessage, required this.focusNode, required this.onChanged});

  /// The field's key in [LumoFormState.values].
  final String name;

  /// The field's name for a reader — pass it straight to the control's
  /// `label:` so the form and the control cannot disagree about it.
  final String label;
  final T value;

  /// The message, or `null`. **Give this to the control's `errorMessage:`.**
  /// Every Lumo field control puts `errorMessage` into its own semantics
  /// `hint`, which is what binds the message to the field; drawing it in a
  /// `Text` beside the control instead leaves it announced by nothing.
  final String? errorMessage;

  /// **Give this to the control's `focusNode:`.** It is how a rejected submit
  /// reaches this field; a control that never receives it can be the first
  /// invalid field and still not take focus.
  final FocusNode focusNode;

  /// Records the new value (and revalidates, once a submit has been rejected).
  final ValueChanged<T> onChanged;

  bool get isInvalid => errorMessage != null;
}

/// One field of a [LumoForm]: a name, a label, an initial value, the rules, and
/// a builder that puts them on a control.
///
/// A BUILDER rather than a fixed control, because the fields of this library
/// are a dozen different widgets (`LumoTextField`, `LumoSelect`,
/// `LumoDateField`, `LumoMultiSelect`, `LumoPhoneInput`…) and every one of them
/// already takes `label`, `errorMessage` and — where it is a single focusable
/// control — `focusNode`. The field owns the state; the control stays the
/// control it already was:
///
///     LumoFormField<String>(
///       name: 'mobile',
///       label: 'شمارهٔ همراه',
///       initialValue: '',
///       validators: [(v) => v.isEmpty ? 'شمارهٔ همراه را بنویسید.' : null],
///       builder: (context, field) => LumoTextField(
///         label: field.label,
///         errorMessage: field.errorMessage,   // ← the binding
///         focusNode: field.focusNode,         // ← the focus target
///         onChanged: field.onChanged,
///       ),
///     )
class LumoFormField<T> extends StatefulWidget {
  const LumoFormField({super.key, required this.name, required this.label, required this.initialValue, required this.builder, this.validators = const []});

  /// The field's key. Unique within one form.
  final String name;

  /// The field's name for a reader, handed on through [LumoFieldState.label].
  /// REQUIRED: a field the form knows only by `name` cannot be named to anyone.
  final String label;
  final T initialValue;

  /// The rules, in order. The FIRST message wins — put the "is it there at all"
  /// rule first, exactly as the web's `lumoValidators().all(…)` says to.
  final List<LumoFieldValidator<T>> validators;

  final Widget Function(BuildContext context, LumoFieldState<T> field) builder;

  @override
  State<LumoFormField<T>> createState() => _LumoFormFieldState<T>();
}

class _LumoFormFieldState<T> extends State<LumoFormField<T>> {
  final FocusNode _focus = FocusNode();
  LumoFormState? _form;

  String? _validate(Object? value) {
    for (final rule in widget.validators) {
      final message = rule(value as T);
      if (message != null) return message;
    }
    return null;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Registration order IS declaration order: `didChangeDependencies` runs as
    // each child is inflated, in the order the children were listed.
    final form = LumoForm.of(context);
    if (identical(form, _form)) return;
    _form?._unregister(widget.name, _focus);
    _form = form;
    form._register(name: widget.name, label: widget.label, focusNode: _focus, initialValue: widget.initialValue, validate: _validate);
  }

  @override
  void dispose() {
    _form?._unregister(widget.name, _focus);
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final form = _form!;
    return ListenableBuilder(
      listenable: form,
      builder: (context, _) => widget.builder(
        context,
        LumoFieldState<T>(
          name: widget.name,
          label: widget.label,
          value: form.valueOf<T>(widget.name) ?? widget.initialValue,
          errorMessage: form.errorOf(widget.name),
          focusNode: _focus,
          onChanged: (value) => form.setValue(widget.name, value),
        ),
      ),
    );
  }
}
