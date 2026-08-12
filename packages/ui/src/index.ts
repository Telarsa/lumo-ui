export { Button, IconButton } from "./button.tsx";
export type { ButtonProps, IconButtonProps } from "./button.tsx";

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupTextVariants,
  buttonGroupVariants,
} from "./button-group.tsx";
export type {
  ButtonGroupProps,
  ButtonGroupSeparatorProps,
  ButtonGroupTextProps,
} from "./button-group.tsx";

export { AspectRatio, aspectRatioVariants } from "./aspect-ratio.tsx";
export type { AspectRatioProps } from "./aspect-ratio.tsx";

export {
  Description,
  FieldError,
  FOCUS_RING_SELF,
  Field,
  FieldInput,
  Form,
  Label,
  descriptionVariants,
  fieldErrorVariants,
  fieldVariants,
  formVariants,
  labelVariants,
  optional,
  useFieldControl,
} from "./form.tsx";
export type {
  DescriptionProps,
  FieldErrorProps,
  FieldInputProps,
  FieldProps,
  FormProps,
  FormValidationBehavior,
  LabelProps,
} from "./form.tsx";

/**
 * Form STATE, which is a separate registry item from the form CHROME above and
 * must stay one: `form.tsx` travels with every labelled control in the library,
 * and folding the state layer into it would make `@tanstack/react-form` a
 * declared dependency of `checkbox`. See `form-state.tsx`'s header.
 */
export {
  LumoForm,
  fieldControl,
  firstError,
  focusFirstInvalid,
  isValidNationalId,
  lumoValidators,
  revalidateLogic,
  useLumoForm,
  visibleLength,
} from "./form-state.tsx";
export type {
  LumoFieldControl,
  LumoFormField,
  LumoFormInstance,
  LumoFormProps,
  LumoValidator,
} from "./form-state.tsx";

export { TextField, inputVariants } from "./text-field.tsx";
export type { TextFieldProps } from "./text-field.tsx";

export {
  InputGroup,
  InputGroupButton,
  inputGroupAddonVariants,
  inputGroupInputVariants,
} from "./input-group.tsx";
export type { InputGroupButtonProps, InputGroupProps } from "./input-group.tsx";

export {
  InputOtp,
  otpDigits,
  inputOtpCaretVariants,
  inputOtpControlVariants,
  inputOtpRowVariants,
  inputOtpSlotVariants,
} from "./input-otp.tsx";
export type { InputOtpProps } from "./input-otp.tsx";

export {
  COUNTRIES,
  PhoneInput,
  isValidPhone,
  phoneDigits,
  phoneInputControlVariants,
  phoneInputRowVariants,
  toE164,
  toNational,
} from "./phone-input.tsx";
export type { PhoneCountry, PhoneInputProps } from "./phone-input.tsx";

export { TextArea, textAreaVariants } from "./text-area.tsx";
export type { TextAreaProps } from "./text-area.tsx";

export { SearchField, searchInputVariants } from "./search-field.tsx";
export type { SearchFieldProps } from "./search-field.tsx";

export { NumberField, numberInputVariants, stepperVariants } from "./number-field.tsx";
export type { NumberFieldProps } from "./number-field.tsx";

export {
  Checkbox,
  CheckboxGroup,
  checkboxIndicatorVariants,
  checkboxVariants,
} from "./checkbox.tsx";
export type { CheckboxGroupProps, CheckboxProps } from "./checkbox.tsx";

export {
  Radio,
  RadioGroup,
  radioIndicatorVariants,
  radioListVariants,
  radioVariants,
} from "./radio-group.tsx";
export type { RadioGroupProps, RadioProps } from "./radio-group.tsx";

export {
  Switch,
  switchThumbVariants,
  switchTrackVariants,
  switchVariants,
} from "./switch.tsx";
export type { SwitchProps, SwitchVariantProps } from "./switch.tsx";

export { Link, linkVariants } from "./link.tsx";
export type { LinkCurrent, LinkProps } from "./link.tsx";

export { Badge, badgeVariants } from "./badge.tsx";
export type { BadgeProps } from "./badge.tsx";

export { Tag, tagVariants } from "./tag.tsx";
export type { TagProps } from "./tag.tsx";

export {
  Avatar,
  avatarStatusVariants,
  avatarStatusWrapperVariants,
  avatarVariants,
} from "./avatar.tsx";
export type { AvatarProps } from "./avatar.tsx";

export {
  Card,
  CardAction,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
} from "./card.tsx";
export type {
  CardDescriptionProps,
  CardProps,
  CardSectionProps,
  CardTitleProps,
} from "./card.tsx";

export { Alert, alertCloseVariants, alertIconVariants, alertVariants } from "./alert.tsx";
export type { AlertDismissProps, AlertLive, AlertProps } from "./alert.tsx";

export { EmptyState, emptyStateMediaVariants, emptyStateVariants } from "./empty-state.tsx";
export type { EmptyStateProps } from "./empty-state.tsx";

export { Separator, separatorVariants } from "./separator.tsx";
export type { SeparatorProps } from "./separator.tsx";

export { Skeleton, skeletonVariants } from "./skeleton.tsx";
export type { SkeletonProps } from "./skeleton.tsx";

export {
  SkeletonAvatar,
  SkeletonCard,
  SkeletonForm,
  SkeletonTable,
  SkeletonText,
  skeletonAvatarVariants,
} from "./skeleton-presets.tsx";
export type {
  SkeletonAvatarProps,
  SkeletonCardProps,
  SkeletonFormProps,
  SkeletonTableProps,
  SkeletonTextProps,
} from "./skeleton-presets.tsx";

export { Spinner, spinnerVariants } from "./spinner.tsx";
export type { SpinnerProps } from "./spinner.tsx";

export {
  Meter,
  ProgressBar,
  progressFillVariants,
  progressTrackVariants,
} from "./progress.tsx";
export type { MeterProps, ProgressBarProps } from "./progress.tsx";

export { Kbd, kbdVariants } from "./kbd.tsx";
export type { KbdProps } from "./kbd.tsx";

export {
  Container,
  Grid,
  Stack,
  containerVariants,
  gridVariants,
  stackVariants,
} from "./stack.tsx";
export type { BoxTag, ContainerProps, GridProps, StackProps } from "./stack.tsx";

export {
  Dialog,
  DialogDescription,
  DialogHeading,
  DialogModal,
  DialogOverlay,
  DialogTrigger,
  dialogModalVariants,
  dialogOverlayVariants,
  dialogVariants,
} from "./dialog.tsx";
export type {
  DialogDescriptionProps,
  DialogHeadingProps,
  DialogModalProps,
  DialogOverlayProps,
  DialogProps,
  DialogTriggerProps,
} from "./dialog.tsx";

export { AlertDialog, alertDialogFooterVariants } from "./alert-dialog.tsx";
export type { AlertDialogProps, AlertDialogTone } from "./alert-dialog.tsx";

export { Drawer, DrawerOverlay, drawerOverlayVariants, drawerVariants } from "./drawer.tsx";
export type { DrawerOverlayProps, DrawerProps } from "./drawer.tsx";

export { Popover, PopoverDescription, PopoverTrigger, popoverVariants } from "./popover.tsx";
export type {
  LumoPlacement,
  PopoverDescriptionProps,
  PopoverProps,
  PopoverTriggerProps,
} from "./popover.tsx";

export { Tooltip, TooltipTrigger, tooltipVariants } from "./tooltip.tsx";
export type { TooltipProps, TooltipTriggerProps } from "./tooltip.tsx";

export {
  Menu,
  MenuItem,
  MenuPopover,
  MenuSection,
  MenuSeparator,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
  SubmenuTrigger,
  menuCheckboxIndicatorVariants,
  menuCurrentIndicatorVariants,
  menuRadioIndicatorVariants,
  menuItemVariants,
  menuPopoverVariants,
  menuSectionHeaderVariants,
  menuSectionVariants,
  menuSeparatorVariants,
  menuVariants,
} from "./menu.tsx";
export type {
  MenuCheckboxItemProps,
  MenuItemProps,
  MenuPopoverProps,
  MenuProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSectionProps,
  MenuSeparatorProps,
  MenuTriggerProps,
  SubmenuTriggerProps,
} from "./menu.tsx";

export {
  DataGrid,
  DataGridColumnsMenu,
  DataGridEmpty,
  DataGridPagination,
  DataGridSearch,
  DataGridToolbar,
  dataGridEmptyVariants,
  dataGridFooterVariants,
  dataGridPageSizeVariants,
  dataGridRangeVariants,
  dataGridToolbarVariants,
  dataGridVariants,
} from "./data-grid.tsx";
export type {
  DataGridColumn,
  DataGridColumnLabel,
  DataGridColumnsMenuProps,
  DataGridEmptyProps,
  DataGridPaginationProps,
  DataGridProps,
  DataGridSearchProps,
  DataGridTableInstance,
  DataGridToolbarProps,
} from "./data-grid.tsx";

export { ContextMenu, ContextMenuTrigger } from "./context-menu.tsx";
export type { ContextMenuProps, ContextMenuTriggerProps } from "./context-menu.tsx";

export {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopover,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  selectGroupLabelVariants,
  selectItemVariants,
  selectListBoxVariants,
  selectPopoverVariants,
  selectSeparatorVariants,
  selectTriggerVariants,
  selectValueVariants,
  selectVariants,
} from "./select.tsx";
export type {
  SelectGroupProps,
  SelectItemProps,
  SelectPopoverProps,
  SelectProps,
  SelectSeparatorProps,
  SelectTriggerProps,
  SelectTriggerVariantProps,
  SelectValueProps,
} from "./select.tsx";

export {
  ComboBox,
  ComboBoxItem,
  comboBoxButtonVariants,
  comboBoxGroupVariants,
  comboBoxInputVariants,
  comboBoxItemVariants,
  comboBoxLabelVariants,
  comboBoxListBoxVariants,
  comboBoxPopoverVariants,
  comboBoxVariants,
} from "./combobox.tsx";
export type { ComboBoxItemProps, ComboBoxProps } from "./combobox.tsx";

export {
  Tab,
  TabList,
  TabPanel,
  Tabs,
  tabListVariants,
  tabPanelVariants,
  tabVariants,
  tabsVariants,
} from "./tabs.tsx";
export type { TabListProps, TabPanelProps, TabProps, TabsProps } from "./tabs.tsx";

export {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
  disclosureChevronVariants,
  disclosureGroupVariants,
  disclosureHeadingVariants,
  disclosurePanelVariants,
  disclosureTriggerVariants,
  disclosureVariants,
} from "./disclosure.tsx";
export type {
  DisclosureGroupProps,
  DisclosurePanelProps,
  DisclosureProps,
  DisclosureTriggerProps,
} from "./disclosure.tsx";

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  Breadcrumbs,
  breadcrumbEllipsisVariants,
  breadcrumbSeparatorVariants,
  breadcrumbVariants,
  breadcrumbsVariants,
} from "./breadcrumbs.tsx";
export type {
  BreadcrumbEllipsisProps,
  BreadcrumbProps,
  BreadcrumbsProps,
} from "./breadcrumbs.tsx";

export {
  Toolbar,
  ToolbarItem,
  ToolbarSeparator,
  toolbarSeparatorVariants,
  toolbarVariants,
} from "./toolbar.tsx";
export type { ToolbarItemProps, ToolbarProps, ToolbarSeparatorProps } from "./toolbar.tsx";

export { ToggleButton, ToggleButtonGroup } from "./toggle-group.tsx";
export type { ToggleButtonGroupProps, ToggleButtonProps } from "./toggle-group.tsx";
// The classes come from the directive-free module, alongside `toggleVariants`
// and `buttonVariants` further down and for the reason `button.variants.ts`
// records: a cva exported from a `"use client"` file cannot be called by a
// server component, and `shadcn migrate rtl` only walks `cva()` arguments.
export { toggleButtonGroupVariants, toggleButtonVariants } from "./toggle-group.variants.ts";
export type {
  ToggleButtonGroupVariantProps,
  ToggleButtonVariantProps,
} from "./toggle-group.variants.ts";

export { Num, DateText } from "./num.tsx";
export type { NumProps, DateTextProps } from "./num.tsx";

export {
  Cell,
  Column,
  ColumnResizer,
  ResizableTableContainer,
  Row,
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  TableSelectAllColumn,
  TableSelectionCell,
  localeSortFn,
  lumoTableFeatures,
  useLumoTable,
} from "./table.tsx";
export type {
  CellProps,
  ColumnProps,
  ColumnResizerProps,
  ResizableTableContainerProps,
  RowProps,
  TableBodyProps,
  TableFooterProps,
  TableHeaderProps,
  TableProps,
  TableSelectAllColumnProps,
  TableSelectionCellProps,
  // The structural seam the grid reads TanStack through. Exported because a
  // consumer wiring their own state layer needs to know what `Table` asks for —
  // and because the interfaces ARE the statement that TanStack owns no ARIA.
  LumoTableColumn,
  LumoTableFeatures,
  LumoTableInstance,
  LumoTableOptions,
  LumoTableRow,
} from "./table.tsx";

/*
 * Same rule as `pagination.variants.ts` and `chart.variants.ts`. Table's classes
 * AND its keyboard-direction arithmetic come from the directive-free module: a
 * server component framing a grid may call them, and `gridArrow(locale)` is a
 * pure function precisely so the RTL arrow mapping can be tested without a DOM.
 */
export {
  cellVariants,
  columnResizerVariants,
  columnVariants,
  gridArrow,
  resizableTableContainerVariants,
  rowVariants,
  tableBodyVariants,
  tableFooterVariants,
  tableHeaderVariants,
  tableVariants,
} from "./table.variants.ts";
export type { GridArrow, GridStep } from "./table.variants.ts";

export { ListBox, ListBoxItem, listBoxItemVariants, listBoxVariants } from "./list-box.tsx";
export type { ListBoxItemProps, ListBoxProps } from "./list-box.tsx";

export {
  DescriptionDetail,
  DescriptionGroup,
  DescriptionList,
  DescriptionTerm,
  descriptionDetailVariants,
  descriptionGroupVariants,
  descriptionListVariants,
  descriptionTermVariants,
} from "./description-list.tsx";
export type {
  DescriptionDetailProps,
  DescriptionGroupProps,
  DescriptionListProps,
  DescriptionTermProps,
} from "./description-list.tsx";

export {
  Toast,
  ToastRegion,
  createToastQueue,
  toastRegionVariants,
  toastVariants,
} from "./toast.tsx";
export type {
  LumoQueuedToast,
  LumoToastContent,
  LumoToastQueue,
  ToastProps,
  ToastRegionProps,
  ToastTone,
  ToastVariantProps,
} from "./toast.tsx";

export {
  Slider,
  sliderFillVariants,
  sliderThumbVariants,
  sliderTrackVariants,
  sliderVariants,
} from "./slider.tsx";
export type { SliderProps, SliderVariantProps } from "./slider.tsx";

export {
  TagGroup,
  TagItem,
  TagList,
  tagGroupVariants,
  tagItemVariants,
  tagListVariants,
  tagRemoveVariants,
} from "./tag-group.tsx";
export type {
  TagGroupProps,
  TagItemProps,
  TagItemVariantProps,
  TagListProps,
} from "./tag-group.tsx";

export { Pagination } from "./pagination.tsx";
export type { PaginationProps } from "./pagination.tsx";

export {
  Steps,
  stepConnectorVariants,
  stepMarkerVariants,
  stepTitleVariants,
  stepVariants,
  stepsListVariants,
  stepsVariants,
} from "./steps.tsx";
export type { StepItem, StepStatus, StepsProps } from "./steps.tsx";

export {
  SegmentedControl,
  SegmentedControlItem,
  segmentedControlItemVariants,
  segmentedControlVariants,
} from "./segmented-control.tsx";
export type {
  SegmentedControlItemProps,
  SegmentedControlProps,
  SegmentedControlVariantProps,
} from "./segmented-control.tsx";

export { buttonVariants } from "./button.variants.ts";
export type { ButtonVariantProps } from "./button.variants.ts";

/*
 * Pagination's classes and its page-window arithmetic come from the
 * directive-free module, NOT through `pagination.tsx`. Re-exporting them from
 * the client component would turn them back into client references in the RSC
 * graph — which is the exact failure `button.variants.ts` documents, and the
 * reason `packages/blocks/src/listing-grid.tsx` can render a server-side pager
 * of real `<a href>` links with these classes at all.
 */
export {
  paginationGapVariants,
  paginationItemVariants,
  paginationListVariants,
  paginationRange,
  paginationVariants,
} from "./pagination.variants.ts";
export type {
  PaginationItemVariantProps,
  PaginationSlot,
} from "./pagination.variants.ts";

export { LumoProvider } from "./provider.tsx";
export type { LumoProviderProps } from "./provider.tsx";

export {
  HoverCard,
  hoverCardContentVariants,
  hoverCardTriggerVariants,
  hoverCardVariants,
} from "./hover-card.tsx";
export type { HoverCardProps } from "./hover-card.tsx";

export {
  Autocomplete,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteListBox,
  autocompleteInputVariants,
  autocompleteItemVariants,
  autocompleteLabelVariants,
  autocompleteListBoxVariants,
} from "./autocomplete.tsx";
export type {
  AutocompleteInputProps,
  AutocompleteItemProps,
  AutocompleteListBoxProps,
  AutocompleteMatch,
  AutocompleteProps,
} from "./autocomplete.tsx";

export {
  Rating,
  ratingButtonVariants,
  ratingStarVariants,
  ratingVariants,
} from "./rating.tsx";
export type {
  InteractiveRatingProps,
  RatingProps,
  RatingVariantProps,
  ReadOnlyRatingProps,
} from "./rating.tsx";

export { FileUpload, FileUploadItem, FileUploadList } from "./file-upload.tsx";
export type {
  FileUploadItemProps,
  FileUploadListProps,
  FileUploadProps,
} from "./file-upload.tsx";

/*
 * Same rule as `pagination.variants.ts` above, for the same reason: FileUpload's
 * classes AND `formatFileSize` come from the directive-free module, never
 * through `file-upload.tsx`. A list of already-uploaded attachments is text and
 * a formatted number with no interaction — the most server-renderable thing in
 * a file feature — and routing the formatter through the client component would
 * make it a client reference and fail that page's prerender.
 */
export {
  dropZoneVariants,
  fileUploadItemVariants,
  fileUploadListVariants,
  fileUploadRemoveVariants,
  formatFileSize,
} from "./file-upload.variants.ts";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "./carousel.tsx";
export type {
  CarouselApi,
  CarouselContentProps,
  CarouselControlProps,
  CarouselItemProps,
  CarouselProps,
} from "./carousel.tsx";

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  commandCheckVariants,
  commandEmptyVariants,
  commandGroupHeadingVariants,
  commandGroupVariants,
  commandInputVariants,
  commandInputWrapperVariants,
  commandItemVariants,
  commandListVariants,
  commandSeparatorVariants,
  commandShortcutVariants,
  commandVariants,
} from "./command.tsx";
export type {
  CommandDialogProps,
  CommandEmptyProps,
  CommandGroupProps,
  CommandInputProps,
  CommandItemProps,
  CommandListProps,
  CommandProps,
  CommandSeparatorProps,
  CommandShortcutProps,
} from "./command.tsx";

export {
  ChartContainer,
  ChartData,
  ChartLegend,
  ChartStyle,
  chartTooltip,
  // TanStack's own marks and scales, re-exported so a chart is composed from a
  // single import. Deliberately unwrapped — see chart.tsx.
  areaY,
  barY,
  defineChart,
  dot,
  lineY,
  scaleBand,
  scaleLinear,
  scalePoint,
} from "./chart.tsx";
export type {
  ChartContainerProps,
  ChartDataProps,
  ChartLegendProps,
  ChartRow,
} from "./chart.tsx";

/*
 * Same rule as `pagination.variants.ts` above. Chart's classes, its theme
 * stylesheet builder AND its direction arithmetic come from the directive-free
 * module, never through `chart.tsx`. The chart panel on the roadmap is a SERVER
 * component — a title, a delta and a legend key around a client island — and
 * routing `chartMirror` or `chartContainerVariants` through the client component
 * would make them client references and fail that page's prerender.
 */
export {
  CHART_PIE_SWEEP,
  CHART_PIE_SWEEP_HALF,
  CHART_ROLE_DESCRIPTION,
  CHART_VALUE_AXIS_TRAILING_EDGE,
  TANSTACK_ROLE_DESCRIPTION,
  chartCategoryAxis,
  chartColor,
  chartColorVar,
  chartContainerVariants,
  chartLegendItemVariants,
  chartLegendVariants,
  chartMirror,
  chartPieCenterVariants,
  chartRenderSvg,
  chartStyleSheet,
  chartTickFormatter,
  chartTooltipIndicatorVariants,
  chartTooltipVariants,
  chartValueAxis,
} from "./chart.variants.ts";
export type {
  ChartAxisSpecOptions,
  ChartConfig,
  ChartAxisMirror,
  ChartMirror,
  ChartPieSweep,
} from "./chart.variants.ts";

export {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentMeta,
  AttachmentName,
  AttachmentProgress,
  AttachmentRemove,
  attachmentGroupVariants,
  attachmentMediaVariants,
  attachmentMetaVariants,
  attachmentVariants,
} from "./attachment.tsx";
export type {
  AttachmentMediaProps,
  AttachmentMetaProps,
  AttachmentNameProps,
  AttachmentProgressProps,
  AttachmentProps,
  AttachmentRemoveProps,
  AttachmentSectionProps,
  AttachmentState,
} from "./attachment.tsx";

export {
  Bubble,
  BubbleCollapse,
  BubbleGroup,
  BubbleReactions,
  bubbleGroupVariants,
  bubbleReactionsVariants,
  bubbleVariants,
} from "./bubble.tsx";
export type {
  BubbleCollapseProps,
  BubbleGroupProps,
  BubbleGrouping,
  BubbleProps,
  BubbleReactionsProps,
  BubbleVariant,
} from "./bubble.tsx";

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item.tsx";
export type {
  ItemButtonProps,
  ItemDescriptionProps,
  ItemLinkProps,
  ItemMediaProps,
  ItemProps,
  ItemSectionProps,
  ItemSeparatorProps,
  ItemStaticProps,
} from "./item.tsx";

/*
 * Same rule as `pagination.variants.ts` above: item's cva definitions export
 * from the directive-free module directly — re-exporting them through the
 * "use client" component would turn them back into client references.
 */
export {
  itemActionsVariants,
  itemContentVariants,
  itemDescriptionVariants,
  itemFooterVariants,
  itemGroupVariants,
  itemHeaderVariants,
  itemMediaVariants,
  itemTitleVariants,
  itemVariants,
} from "./item.variants.ts";
export type { ItemMediaVariantProps, ItemVariantProps } from "./item.variants.ts";

export { Marker, MarkerIcon, markerVariants } from "./marker.tsx";
export type { MarkerIconProps, MarkerProps } from "./marker.tsx";

export { Menubar, MenubarButton, menubarButtonVariants, menubarVariants } from "./menubar.tsx";
export type { MenubarButtonProps, MenubarProps } from "./menubar.tsx";

export {
  Message,
  MessageAvatar,
  MessageBody,
  MessageGroup,
  MessageHeader,
  MessageTime,
  messageBodyVariants,
  messageGroupVariants,
  messageVariants,
} from "./message.tsx";
export type {
  MessageProps,
  MessageSectionProps,
  MessageTimeProps,
  MessageVariant,
} from "./message.tsx";

export {
  MessageScroller,
  messageScrollerJumpVariants,
  messageScrollerVariants,
  messageScrollerViewportVariants,
} from "./message-scroller.tsx";
export type { MessageScrollerProps } from "./message-scroller.tsx";

export {
  Timeline,
  TimelineBody,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  timelineBodyVariants,
  timelineItemVariants,
  timelineMarkerVariants,
  timelineRailVariants,
  timelineTimeVariants,
  timelineTitleVariants,
  timelineVariants,
} from "./timeline.tsx";
export type {
  TimelineItemProps,
  TimelineProps,
  TimelineSectionProps,
  TimelineTimeProps,
} from "./timeline.tsx";

export { Scrollspy, scrollspyLinkVariants, scrollspyVariants } from "./scrollspy.tsx";
export type { ScrollspyItem, ScrollspyProps } from "./scrollspy.tsx";

export { IconTile, iconTileVariants } from "./icon-tile.tsx";
export type { IconTileProps } from "./icon-tile.tsx";

export { IconStack, iconStackOverflowVariants, iconStackVariants } from "./icon-stack.tsx";
export type { IconStackProps } from "./icon-stack.tsx";

export {
  Frame,
  frameAddressVariants,
  frameBarVariants,
  frameDotVariants,
  frameNotchVariants,
  frameVariants,
} from "./frame.tsx";
export type { FrameProps } from "./frame.tsx";

export {
  Sortable,
  moveItem,
  sortableHandleVariants,
  sortableItemVariants,
  sortableVariants,
} from "./sortable.tsx";
export type { SortableItem, SortableProps, SortableStrings } from "./sortable.tsx";

export {
  Kanban,
  kanbanCardVariants,
  kanbanColumnHeaderVariants,
  kanbanColumnVariants,
  kanbanHandleVariants,
  kanbanRootVariants,
  kanbanVariants,
  moveCard,
} from "./kanban.tsx";
export type { KanbanCard, KanbanColumn, KanbanProps, KanbanStrings } from "./kanban.tsx";

export {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  nativeSelectVariants,
} from "./native-select.tsx";
export type {
  NativeSelectOptGroupProps,
  NativeSelectOptionProps,
  NativeSelectProps,
} from "./native-select.tsx";

export {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuPanel,
  NavigationMenuTrigger,
  navigationMenuChevronVariants,
  navigationMenuLinkVariants,
  navigationMenuPanelVariants,
  navigationMenuTriggerVariants,
  navigationMenuVariants,
} from "./navigation-menu.tsx";
export type {
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuPanelProps,
  NavigationMenuProps,
  NavigationMenuTriggerProps,
} from "./navigation-menu.tsx";

export {
  Resizable,
  resizableHandleVariants,
  resizablePanelVariants,
  resizableVariants,
} from "./resizable.tsx";
export type { ResizableProps } from "./resizable.tsx";

export { ScrollArea, scrollAreaVariants } from "./scroll-area.tsx";
export type { ScrollAreaProps } from "./scroll-area.tsx";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from "./sidebar.tsx";
/*
 * The variants come from the DIRECTIVE-FREE module, never through sidebar.tsx:
 * a re-export routed through a "use client" module is a client reference for
 * every importer, however server-safe its definition file is — the same latent
 * break buttonVariants once shipped for real, caught here by review.
 */
export {
  sidebarBadgeVariants,
  sidebarContentVariants,
  sidebarFooterVariants,
  sidebarGroupLabelVariants,
  sidebarGroupVariants,
  sidebarHeaderVariants,
  sidebarItemLabelVariants,
  sidebarItemVariants,
  sidebarVariants,
} from "./sidebar.variants.ts";
export type {
  SidebarGroupProps,
  SidebarItemProps,
  SidebarProps,
  SidebarSectionProps,
  SidebarTriggerProps,
} from "./sidebar.tsx";

/*
 * `calendarDay` comes from the directive-free adapter DIRECTLY, never through
 * `calendar.tsx` — same rule as the variants below. It is what a caller without
 * `@internationalized/date` uses to write the bounds a caption dropdown
 * requires, and a server component must be able to call it.
 */
export { calendarDay } from "./calendar-datelib.ts";

export { Calendar, calendarChevron, calendarClassNames, describedByWith } from "./calendar.tsx";
export type {
  CalendarBaseProps,
  CalendarCaptionLayout,
  CalendarNavigation,
  CalendarProps,
} from "./calendar.tsx";

/*
 * The whole date family's classes come from ONE directive-free module, and they
 * come from it DIRECTLY — never through the six components, every one of which
 * carries "use client". Same rule as `pagination.variants.ts` above, and the
 * same reason: a re-export routed through a client module is a client reference
 * for every importer however server-safe its definition is. A server component
 * rendering a static month beside the interactive calendar needs these.
 */
export {
  calendarCellVariants,
  calendarDayButtonVariants,
  calendarDropdownRootVariants,
  calendarDropdownsVariants,
  calendarDropdownVariants,
  calendarFooterVariants,
  calendarGridVariants,
  calendarHeaderCellVariants,
  calendarHeaderVariants,
  calendarHeadingVariants,
  calendarMonthsVariants,
  calendarNavButtonVariants,
  calendarNavVariants,
  calendarVariants,
  dateInputVariants,
  dateLiteralVariants,
  datePickerGroupVariants,
  datePickerTriggerVariants,
  dateRangeSeparatorVariants,
  dateSegmentVariants,
  rangeCalendarCellVariants,
  rangeCalendarSelectionVariants,
} from "./calendar.variants.ts";

export { DateField } from "./date-field.tsx";
export type { DateBounds, DateFieldProps, DateFieldSize } from "./date-field.tsx";

export { DateInput } from "./date-input.tsx";
export type { DateInputHandle, DateInputProps, DateInputSize } from "./date-input.tsx";

export {
  EDITABLE_SEGMENTS,
  TIME_SEGMENTS,
  digitFromKey,
  toValue,
  useDateFieldState,
  useTimeFieldState,
} from "./date-field-state.ts";
export type {
  DateFieldState,
  DateFieldStateOptions,
  DateSegmentType,
  EditableSegmentType,
  LumoDateSegment,
  TimeFields,
  TimeFieldStateOptions,
} from "./date-field-state.ts";

export { DatePicker } from "./date-picker.tsx";
export type { DatePickerBaseProps, DatePickerProps } from "./date-picker.tsx";

export { DateRangePicker } from "./date-range-picker.tsx";
export type { DateRangePickerProps } from "./date-range-picker.tsx";

export { RangeCalendar } from "./range-calendar.tsx";
export type {
  CalendarDateRange,
  RangeCalendarBaseProps,
  RangeCalendarProps,
} from "./range-calendar.tsx";

/*
 * The preset-driven range picker. `resolveDateRangePreset` and `todayIn` are
 * exported beside the component because the arithmetic is the valuable half and
 * has no React in it: a server route that must run the same «این ماه» its
 * dashboard displays should call this function rather than grow a second
 * implementation that agrees today and drifts in Esfand.
 */
export { DateSelector, resolveDateRangePreset, todayIn } from "./date-selector.tsx";
export type {
  DateRangeRule,
  DateSelectorPreset,
  DateSelectorProps,
} from "./date-selector.tsx";

/* Directive-free module, direct — same rule as the date family above. */
export {
  dateSelectorPanelVariants,
  dateSelectorPlaceholderVariants,
  dateSelectorPresetListVariants,
  dateSelectorPresetVariants,
  dateSelectorTriggerVariants,
  dateSelectorValueVariants,
} from "./date-selector.variants.ts";
export type { DateSelectorTriggerVariantProps } from "./date-selector.variants.ts";

export { TimeField } from "./time-field.tsx";
export type { TimeFieldProps } from "./time-field.tsx";

/*
 * The standalone two-state button. Its set-of-options sibling is
 * `toggle-group.tsx` further up — `ToggleButton` / `ToggleButtonGroup`.
 */
export { IconToggle, Toggle } from "./toggle.tsx";
export type { IconToggleProps, ToggleProps } from "./toggle.tsx";

/* Directive-free module, direct — same rule as the date family above. */
export { toggleVariants } from "./toggle.variants.ts";
export type { ToggleVariantProps } from "./toggle.variants.ts";

export { Tree, TreeItem } from "./tree.tsx";
export type { TreeItemProps, TreeProps } from "./tree.tsx";

/*
 * Same rule again. A server component rendering a static outline beside the
 * interactive tree calls `treeChevronTurnFor(locale)` and the row classes.
 */
export {
  TREE_CHEVRON_GLYPH,
  treeChevronGlyphVariants,
  treeChevronTurn,
  treeChevronTurnFor,
  treeChevronVariants,
  treeItemVariants,
  treeLeafSpacerVariants,
  treeVariants,
} from "./tree.variants.ts";
export type { TreeChevronTurn } from "./tree.variants.ts";

export { VirtualList } from "./virtual-list.tsx";
export type { VirtualListProps } from "./virtual-list.tsx";

/*
 * Same rule again — and here it is the RTL arithmetic that needs it. A server
 * component framing a virtualised list (a heading, a count, a filter bar) may
 * call `virtualMirror(locale, orientation)` to reason about the same direction
 * the client island will use, and routing it through `virtual-list.tsx` would
 * make it a client reference.
 */
export {
  virtualListItemVariants,
  virtualListSizerVariants,
  virtualListVariants,
  virtualMirror,
} from "./virtual-list.variants.ts";
export type { VirtualListOrientation, VirtualMirror } from "./virtual-list.variants.ts";

/*
 * A timeline of tasks over dates, in the reader's own calendar.
 *
 * The arithmetic is exported beside the component on purpose. `ganttGeometry`,
 * `ganttBarPlacement`, `moveGanttTask` and `ganttDateIn` have no React and no
 * DOM in them, so a server route that has to reason about the same range — or a
 * test that wants the placement without a renderer — calls the same functions
 * rather than a second implementation that agrees today and drifts in Esfand.
 * Same call `date-selector.tsx` makes for `resolveDateRangePreset`.
 */
export {
  GANTT_SCALES,
  Gantt,
  ganttBarPlacement,
  ganttDate,
  ganttDateIn,
  ganttGeometry,
  moveGanttTask,
} from "./gantt.tsx";
export type {
  GanttColumn,
  GanttGeometry,
  GanttPlacement,
  GanttProps,
  GanttScale,
  GanttStrings,
  GanttTask,
} from "./gantt.tsx";

/*
 * Directive-free module, imported directly — the same rule the date family
 * above follows. A server component drawing a static legend or a print view of
 * the same chart may call these; routing them through `gantt.tsx` would make
 * every one of them a client reference in the RSC graph.
 */
export {
  ganttBarProgressVariants,
  ganttBarVariants,
  ganttColumnHeaderVariants,
  ganttRowVariants,
  ganttScaleButtonVariants,
  ganttScaleGroupVariants,
  ganttScaleRowVariants,
  ganttSplitVariants,
  ganttTaskHeaderVariants,
  ganttTaskListVariants,
  ganttTaskRowVariants,
  ganttTimelineVariants,
  ganttVariants,
} from "./gantt.variants.ts";

/*
 * The scheduling calendar. `event-calendar.variants.ts` is exported DIRECTLY
 * beside it, the same rule the date family above follows: a `cva()` re-exported
 * through a `"use client"` module becomes a client reference in the RSC graph,
 * and a server component that CALLS it fails the build. A page framing a
 * read-only month grid — a heading, a legend, a printed schedule — may use the
 * classes without paying for the island.
 *
 * `layoutDayEvents` and `indexEvents` are exported for the reason
 * `resolveDateRangePreset` is: the arithmetic is the valuable part, it has no
 * React in it, and a caller writing their own day view should not reimplement
 * the overlap packing or the per-day segment cut.
 */
export {
  EventCalendar,
  eventCalendarDay,
  eventCalendarEvent,
  indexEvents,
  layoutDayEvents,
} from "./event-calendar.tsx";
export type {
  EventCalendarAllDayEvent,
  EventCalendarEvent,
  EventCalendarEventInput,
  EventCalendarPlacement,
  EventCalendarProps,
  EventCalendarSegment,
  EventCalendarSpan,
  EventCalendarStrings,
  EventCalendarTimedEvent,
  EventCalendarTone,
  EventCalendarView,
} from "./event-calendar.tsx";
export {
  eventCalendarAgendaDateVariants,
  eventCalendarAgendaDayVariants,
  eventCalendarAgendaRowVariants,
  eventCalendarAgendaTimeVariants,
  eventCalendarAgendaVariants,
  eventCalendarAllDayCaptionVariants,
  eventCalendarAllDayVariants,
  eventCalendarChipVariants,
  eventCalendarDayCellVariants,
  eventCalendarDayNumberVariants,
  eventCalendarEmptyVariants,
  eventCalendarGridVariants,
  eventCalendarGutterVariants,
  eventCalendarHourLineVariants,
  eventCalendarHourVariants,
  eventCalendarMoreVariants,
  eventCalendarNavButtonVariants,
  eventCalendarNavVariants,
  eventCalendarPeriodVariants,
  eventCalendarTimedColumnVariants,
  eventCalendarToolbarVariants,
  eventCalendarVariants,
  eventCalendarViewButtonVariants,
  eventCalendarViewSwitchVariants,
  eventCalendarWeekCellVariants,
  eventCalendarWeekdayVariants,
  eventCalendarWeekGridVariants,
  eventCalendarWeekHeadDayVariants,
  eventCalendarWeekHeadVariants,
} from "./event-calendar.variants.ts";
export type {
  EventCalendarChipVariantProps,
  EventCalendarDayCellVariantProps,
  EventCalendarViewButtonVariantProps,
} from "./event-calendar.variants.ts";
