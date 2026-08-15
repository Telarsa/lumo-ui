export { Button, IconButton } from "./button.tsx";
export type { ButtonProps, IconButtonProps } from "./button.tsx";

export { HeatmapChart } from "./heatmap-chart.tsx";
export type { HeatmapChartProps, HeatmapDatum } from "./heatmap-chart.tsx";
export { RadarChart } from "./radar-chart.tsx";
export type { RadarChartProps, RadarDatum, RadarSeries } from "./radar-chart.tsx";
export { TreemapChart } from "./treemap-chart.tsx";
export type { TreemapChartProps, TreemapDatum } from "./treemap-chart.tsx";
export { SankeyChart } from "./sankey-chart.tsx";
export type {
  SankeyChartProps,
  SankeyLinkDatum,
  SankeyNodeDatum,
} from "./sankey-chart.tsx";

export { ColorPicker } from "./color-picker.tsx";
export type { ColorPickerProps, ColorSwatch } from "./color-picker.tsx";
export { ColorInput, normalizeColor } from "./color-input.tsx";
export type { ColorFormat, ColorInputProps } from "./color-input.tsx";
export { JsonInput, validateJson } from "./json-input.tsx";
export type { JsonInputProps, JsonValidation } from "./json-input.tsx";
export { MaskInput, maskValue } from "./mask-input.tsx";
export type { MaskInputProps, MaskValue } from "./mask-input.tsx";
export { MultiSelect } from "./multi-select.tsx";
export type { MultiSelectOption, MultiSelectProps } from "./multi-select.tsx";
export { TagsInput } from "./tags-input.tsx";
export type { TagsInputProps } from "./tags-input.tsx";
export { Cascader, resolveCascaderPath } from "./cascader.tsx";
export type { CascaderOption, CascaderProps } from "./cascader.tsx";
export { TreeSelect, treeSelectionState } from "./tree-select.tsx";
export type { TreeSelectOption, TreeSelectProps } from "./tree-select.tsx";
export { RangeSlider } from "./range-slider.tsx";
export type { RangeSliderProps } from "./range-slider.tsx";

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
  useFieldLabelId,
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

/** Form STATE, a separate registry item from the form CHROME above (`form.tsx` travels with every control). */
export {
  LumoForm,
  fieldControl,
  createLatestAsyncValidator,
  formSubmissionState,
  firstError,
  focusFirstInvalid,
  isValidNationalId,
  lumoValidators,
  listFieldControl,
  lumoStandardSchema,
  revalidateLogic,
  useLumoForm,
  visibleLength,
} from "./form-state.tsx";
export type {
  LumoFieldControl,
  LumoFormField,
  LumoFormInstance,
  LumoFormProps,
  LumoFormSubmissionState,
  LumoLatestAsyncValidator,
  LumoListField,
  LumoListFieldControl,
  LumoStandardSchema,
  LumoStandardSchemaIssue,
  LumoValidator,
  LumoValidatorMessages,
} from "./form-state.tsx";

export { Filters } from "./filters.tsx";
export {
  assertQuery,
  createFilter,
  createFilterGroup,
  executeQuery,
  parseQuery,
  queryIssues,
  serializeQuery,
} from "./filters.shared.ts";
export type {
  FilterField,
  FilterOperator,
  FilterOption,
  FilterSelectField,
  FiltersProps,
  FiltersStrings,
  FilterTextField,
} from "./filters.tsx";
export type {
  FilterClause,
  FilterExpression,
  FilterGroup,
  FilterQuery,
  ParseQueryResult,
  QueryCombinator,
  QueryExecutionField,
  QueryExecutionOperator,
  QueryIssue,
  QueryShapeField,
  QueryShapeOperator,
} from "./filters.shared.ts";
export { PowerSearch } from "./power-search.tsx";
export type {
  PowerSearchBooleanField,
  PowerSearchChoiceField,
  PowerSearchCustomEditorProps,
  PowerSearchCustomField,
  PowerSearchDateField,
  PowerSearchField,
  PowerSearchNumberField,
  PowerSearchOperator,
  PowerSearchOption,
  PowerSearchProps,
  PowerSearchSavedView,
  PowerSearchStatus,
  PowerSearchStrings,
  PowerSearchTextField,
} from "./power-search.tsx";

export {
  groupCollection,
  presentAsyncCollection,
  useAsyncCollection,
} from "./async-collection.ts";
export type {
  AsyncCollectionAction,
  AsyncCollectionMessages,
  AsyncCollectionOptions,
  AsyncCollectionPage,
  AsyncCollectionPresentation,
  AsyncCollectionRequest,
  AsyncCollectionResult,
  AsyncCollectionStatus,
  CollectionGroup,
} from "./async-collection.ts";

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
  DialogClose,
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
  DialogCloseProps,
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
  DataGridEditableCell,
  aggregateDataGrid,
  dataGridPinnedStyle,
  reorderDataGridItems,
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
  DataGridAsyncState,
  DataGridColumnsMenuProps,
  DataGridEmptyProps,
  DataGridPaginationProps,
  DataGridProps,
  DataGridSearchProps,
  DataGridTableInstance,
  DataGridToolbarProps,
  DataGridAggregate,
  DataGridEditableCellProps,
  DataGridPin,
} from "./data-grid.tsx";

export { ContextMenu, ContextMenuTrigger } from "./context-menu.tsx";
export type { ContextMenuProps, ContextMenuTriggerProps } from "./context-menu.tsx";

export {
  Select,
  SelectField,
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
  SelectFieldOption,
  SelectFieldProps,
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
// From the directive-free module: a cva exported from a `"use client"` file cannot be
// called by a server component, and `shadcn migrate rtl` only walks `cva()` arguments.
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
  TableTreeCell,
  TableWidgetCell,
  VirtualTableBody,
  localeSortFn,
  lumoTableFeatures,
  useAsyncLumoTable,
  useLumoTable,
  useLumoQueryTable,
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
  TableTreeCellProps,
  TableWidgetCellProps,
  VirtualTableBodyProps,
  // The structural seam the grid reads TanStack through; the interfaces ARE the statement that TanStack owns no ARIA.
  LumoTableColumn,
  AsyncLumoTableOptions,
  LumoExpandableTableRow,
  LumoTableFeatures,
  LumoTableInstance,
  LumoTableOptions,
  LumoQueryTableOptions,
  LumoTableRow,
} from "./table.tsx";

// Directive-free module, direct: a server component framing a grid may call these, and
// `gridArrow(locale)` is a pure function so the RTL arrow mapping is testable without a DOM.
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
export type {
  ListBoxAsyncAction,
  ListBoxAsyncState,
  ListBoxItemProps,
  ListBoxProps,
} from "./list-box.tsx";

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

export { Questionnaire } from "./questionnaire.tsx";
export type {
  QuestionnaireChoice,
  QuestionnaireItem,
  QuestionnaireOptionalItem,
  QuestionnaireProps,
  QuestionnaireRequiredItem,
  QuestionnaireStrings,
  QuestionnaireValue,
} from "./questionnaire.tsx";

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

// Directive-free module, direct — never through the client component, which would turn
// these back into client references (see `button.variants.ts`).
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

export {
  LumoProvider,
  ManagedSurfaces,
  createCommandManager,
  createModalManager,
} from "./provider.tsx";
export type {
  LumoProviderProps,
  LumoSurfaceManager,
  ManagedSurface,
  ManagedSurfacesProps,
} from "./provider.tsx";

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

export {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  collectDroppedFiles,
  createUploadController,
  reorderUploadItems,
  transformUploadFiles,
} from "./file-upload.tsx";
export type {
  FileUploadLifecycle,
  FileUploadLifecycleAction,
  FileUploadItemProps,
  FileUploadListProps,
  FileUploadProps,
  FileUploadRejection,
  FileUploadRejectionReason,
  UploadChunkContext,
  UploadController,
  UploadControllerOptions,
  UploadControllerSnapshot,
  UploadControllerStatus,
  UploadDropEntry,
  UploadTransform,
} from "./file-upload.tsx";

// Directive-free module, direct — same rule as `pagination.variants.ts` above.
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
  CHART_MOTION_UPDATE_DURATION,
  chartMotion,
  chartTooltip,
  // TanStack's own marks and scales, re-exported so a chart is composed from a single import.
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
  ChartAnimation,
  ChartContainerProps,
  ChartDataProps,
  ChartEasing,
  ChartLegendProps,
  ChartMotionOptions,
  ChartRow,
} from "./chart.tsx";

// Directive-free module, direct — same rule as `pagination.variants.ts` above.
export {
  CHART_KEYBOARD_READING_ORDER,
  CHART_MOTION_ATTRIBUTE,
  CHART_MOTION_GUIDE_DURATION,
  CHART_MOTION_MARK_DURATION,
  CHART_MOTION_REDUCED_MOTION_IS_TOTAL,
  CHART_MOTION_STAGGER,
  CHART_MOTION_STAGGER_STEPS,
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
  chartMotionStyleSheet,
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

// Directive-free module, direct — same rule as `pagination.variants.ts` above.
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

export {
  OverflowList,
  fitOverflowItems,
  overflowListItemVariants,
  overflowListMeasureVariants,
  overflowListVariants,
} from "./overflow-list.tsx";
export type {
  OverflowFitInput,
  OverflowListEntry,
  OverflowListProps,
} from "./overflow-list.tsx";

export {
  TransferList,
  transferListActionsVariants,
  transferListPanelVariants,
  transferListVariants,
} from "./transfer-list.tsx";
export type {
  TransferListItem,
  TransferListProps,
  TransferListStrings,
} from "./transfer-list.tsx";

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
// Directive-free module, direct — same rule as `pagination.variants.ts` above.
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

// `calendarDay` comes from the directive-free adapter DIRECTLY: a server component must be able to call it.
export { calendarDay } from "./calendar-datelib.ts";

export { Calendar, CalendarDropdown, calendarChevron, calendarClassNames, describedByWith } from "./calendar.tsx";
export type {
  CalendarBaseProps,
  CalendarCaptionLayout,
  CalendarNavigation,
  CalendarProps,
} from "./calendar.tsx";

// The whole date family's classes come from ONE directive-free module, DIRECTLY.
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

// `resolveDateRangePreset` and `todayIn` are exported beside the component: the arithmetic
// has no React in it, and a server route should call it rather than drift in Esfand.
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

// The standalone two-state button; its set-of-options sibling is `toggle-group.tsx`.
export { IconToggle, Toggle } from "./toggle.tsx";
export type { IconToggleProps, ToggleProps } from "./toggle.tsx";

/* Directive-free module, direct — same rule as the date family above. */
export { toggleVariants } from "./toggle.variants.ts";
export type { ToggleVariantProps } from "./toggle.variants.ts";

export { Tree, TreeItem } from "./tree.tsx";
export type { TreeItemProps, TreeProps } from "./tree.tsx";

// Same rule again: directive-free module, direct.
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
export type { VirtualListHandle, VirtualListProps, VirtualListRange } from "./virtual-list.tsx";

// Same rule again — `virtualMirror(locale, orientation)` must be callable from a server component.
export {
  virtualListItemVariants,
  virtualListSizerVariants,
  virtualListVariants,
  virtualMirror,
} from "./virtual-list.variants.ts";
export type { VirtualListOrientation, VirtualMirror } from "./virtual-list.variants.ts";

// A timeline of tasks over dates. The arithmetic is exported beside the component: no React,
// no DOM, so a server route or a test calls the same functions.
export {
  GANTT_SCALES,
  Gantt,
  ganttBarPlacement,
  ganttDate,
  ganttDateIn,
  ganttGeometry,
  moveGanttTask,
  resizeGanttTask,
  ganttCriticalPath,
  ganttDependencyPath,
  ganttZoom,
  rollupGanttTasks,
} from "./gantt.tsx";
export type {
  GanttColumn,
  GanttDependency,
  GanttGeometry,
  GanttPlacement,
  GanttProps,
  GanttScale,
  GanttResizeEdge,
  GanttStrings,
  GanttTask,
} from "./gantt.tsx";

// Directive-free module, direct — same rule as the date family above.
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

// The scheduling calendar. `event-calendar.variants.ts` is exported DIRECTLY (same rule);
// `layoutDayEvents`/`indexEvents` are exported because the arithmetic is the valuable part.
export {
  EventCalendar,
  eventCalendarDay,
  eventCalendarEvent,
  indexEvents,
  layoutDayEvents,
  applySchedulerMutation,
  expandEventRecurrence,
  groupSchedulerEvents,
  moveSchedulerEvent,
  resizeSchedulerEvent,
  schedulerDraftEvent,
  schedulerZonedEvent,
} from "./event-calendar.tsx";
export type {
  EventCalendarAllDayEvent,
  EventCalendarEventBase,
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
  SchedulerMoveOptions,
  SchedulerDraft,
  SchedulerMutation,
  SchedulerRecurrence,
  SchedulerResizeEdge,
  SchedulerZonedEvent,
  SchedulerZonedEventInput,
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
