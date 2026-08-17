// The registry. Every demo file in this folder is imported here exactly once
// and its two maps are merged in.
//
// `scripts/build-mobile-demos.mjs` fails the build when a file in this folder
// is missing from this list, so a forgotten import is a red build rather than
// a demo that silently disappears from the docs site.
import 'package:flutter/material.dart';

import 'alert.dart' as alert_demos;
import 'alert_dialog.dart' as alert_dialog_demos;
import 'app_bar.dart' as app_bar_demos;
import 'aspect_ratio.dart' as aspect_ratio_demos;
import 'avatar.dart' as avatar_demos;
import 'badge.dart' as badge_demos;
import 'breadcrumbs.dart' as breadcrumbs_demos;
import 'button.dart' as button_demos;
import 'button_group.dart' as button_group_demos;
import 'card.dart' as card_demos;
import 'carousel.dart' as carousel_demos;
import 'checkbox.dart' as checkbox_demos;
import 'combobox.dart' as combobox_demos;
import 'date_field.dart' as date_field_demos;
import 'description_list.dart' as description_list_demos;
import 'dialog.dart' as dialog_demos;
import 'disclosure.dart' as disclosure_demos;
import 'drawer.dart' as drawer_demos;
import 'empty_state.dart' as empty_state_demos;
import 'file_upload.dart' as file_upload_demos;
import 'icon_tile.dart' as icon_tile_demos;
import 'input_group.dart' as input_group_demos;
import 'input_otp.dart' as input_otp_demos;
import 'item.dart' as item_demos;
import 'link.dart' as link_demos;
import 'menu.dart' as menu_demos;
import 'message.dart' as message_demos;
import 'multi_select.dart' as multi_select_demos;
import 'navigation_bar.dart' as navigation_bar_demos;
import 'number_field.dart' as number_field_demos;
import 'phone_input.dart' as phone_input_demos;
import 'popover.dart' as popover_demos;
import 'progress.dart' as progress_demos;
import 'pull_to_refresh.dart' as pull_to_refresh_demos;
import 'radio_group.dart' as radio_group_demos;
import 'rating.dart' as rating_demos;
import 'search_field.dart' as search_field_demos;
import 'segmented_control.dart' as segmented_control_demos;
import 'select.dart' as select_demos;
import 'separator.dart' as separator_demos;
import 'sidebar.dart' as sidebar_demos;
import 'skeleton.dart' as skeleton_demos;
import 'slider.dart' as slider_demos;
import 'stack.dart' as stack_demos;
import 'steps.dart' as steps_demos;
import 'switch.dart' as switch_demos;
import 'table.dart' as table_demos;
import 'tabs.dart' as tabs_demos;
import 'tag.dart' as tag_demos;
import 'tags_input.dart' as tags_input_demos;
import 'text_area.dart' as text_area_demos;
import 'text_field.dart' as text_field_demos;
import 'time_field.dart' as time_field_demos;
import 'timeline.dart' as timeline_demos;
import 'toast.dart' as toast_demos;
import 'toggle.dart' as toggle_demos;
import 'toolbar.dart' as toolbar_demos;
import 'tooltip.dart' as tooltip_demos;

/// Every demo the gallery can render, keyed by the id in the `?demo=` query.
final Map<String, WidgetBuilder> lumoDemos = <String, WidgetBuilder>{
  ...alert_demos.demos,
  ...pull_to_refresh_demos.demos,
  ...navigation_bar_demos.demos,
  ...app_bar_demos.demos,
  ...stack_demos.demos,
  ...sidebar_demos.demos,
  ...aspect_ratio_demos.demos,
  ...table_demos.demos,
  ...input_group_demos.demos,
  ...toolbar_demos.demos,
  ...tags_input_demos.demos,
  ...button_group_demos.demos,
  ...alert_dialog_demos.demos,
  ...avatar_demos.demos,
  ...badge_demos.demos,
  ...breadcrumbs_demos.demos,
  ...button_demos.demos,
  ...card_demos.demos,
  ...carousel_demos.demos,
  ...checkbox_demos.demos,
  ...combobox_demos.demos,
  ...date_field_demos.demos,
  ...description_list_demos.demos,
  ...dialog_demos.demos,
  ...disclosure_demos.demos,
  ...drawer_demos.demos,
  ...empty_state_demos.demos,
  ...file_upload_demos.demos,
  ...icon_tile_demos.demos,
  ...input_otp_demos.demos,
  ...item_demos.demos,
  ...link_demos.demos,
  ...menu_demos.demos,
  ...message_demos.demos,
  ...multi_select_demos.demos,
  ...number_field_demos.demos,
  ...phone_input_demos.demos,
  ...popover_demos.demos,
  ...progress_demos.demos,
  ...radio_group_demos.demos,
  ...rating_demos.demos,
  ...search_field_demos.demos,
  ...segmented_control_demos.demos,
  ...select_demos.demos,
  ...separator_demos.demos,
  ...skeleton_demos.demos,
  ...slider_demos.demos,
  ...steps_demos.demos,
  ...switch_demos.demos,
  ...tabs_demos.demos,
  ...tag_demos.demos,
  ...text_area_demos.demos,
  ...text_field_demos.demos,
  ...time_field_demos.demos,
  ...timeline_demos.demos,
  ...toast_demos.demos,
  ...toggle_demos.demos,
  ...tooltip_demos.demos,
};

/// The localized title and description of every demo, in every served locale.
/// Read at build time by `scripts/build-mobile-demos.mjs`; kept beside the
/// Dart so the two cannot drift.
final Map<String, Map<String, Map<String, String>>> lumoDemoMeta =
    <String, Map<String, Map<String, String>>>{
  ...alert_demos.demoMeta,
  ...pull_to_refresh_demos.demoMeta,
  ...navigation_bar_demos.demoMeta,
  ...app_bar_demos.demoMeta,
  ...stack_demos.demoMeta,
  ...sidebar_demos.demoMeta,
  ...aspect_ratio_demos.demoMeta,
  ...table_demos.demoMeta,
  ...input_group_demos.demoMeta,
  ...toolbar_demos.demoMeta,
  ...tags_input_demos.demoMeta,
  ...button_group_demos.demoMeta,
  ...alert_dialog_demos.demoMeta,
  ...avatar_demos.demoMeta,
  ...badge_demos.demoMeta,
  ...breadcrumbs_demos.demoMeta,
  ...button_demos.demoMeta,
  ...card_demos.demoMeta,
  ...carousel_demos.demoMeta,
  ...checkbox_demos.demoMeta,
  ...combobox_demos.demoMeta,
  ...date_field_demos.demoMeta,
  ...description_list_demos.demoMeta,
  ...dialog_demos.demoMeta,
  ...disclosure_demos.demoMeta,
  ...drawer_demos.demoMeta,
  ...empty_state_demos.demoMeta,
  ...file_upload_demos.demoMeta,
  ...icon_tile_demos.demoMeta,
  ...input_otp_demos.demoMeta,
  ...item_demos.demoMeta,
  ...link_demos.demoMeta,
  ...menu_demos.demoMeta,
  ...message_demos.demoMeta,
  ...multi_select_demos.demoMeta,
  ...number_field_demos.demoMeta,
  ...phone_input_demos.demoMeta,
  ...popover_demos.demoMeta,
  ...progress_demos.demoMeta,
  ...radio_group_demos.demoMeta,
  ...rating_demos.demoMeta,
  ...search_field_demos.demoMeta,
  ...segmented_control_demos.demoMeta,
  ...select_demos.demoMeta,
  ...separator_demos.demoMeta,
  ...skeleton_demos.demoMeta,
  ...slider_demos.demoMeta,
  ...steps_demos.demoMeta,
  ...switch_demos.demoMeta,
  ...tabs_demos.demoMeta,
  ...tag_demos.demoMeta,
  ...text_area_demos.demoMeta,
  ...text_field_demos.demoMeta,
  ...time_field_demos.demoMeta,
  ...timeline_demos.demoMeta,
  ...toast_demos.demoMeta,
  ...toggle_demos.demoMeta,
  ...tooltip_demos.demoMeta,
};
