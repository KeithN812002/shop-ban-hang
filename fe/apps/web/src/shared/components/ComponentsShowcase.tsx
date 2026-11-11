import { Card } from '@workspace/ui/components/Card'
import { ScrollArea } from '@workspace/ui/components/ScrollArea'
import { Button } from '@workspace/ui/components/Button'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// Accordion
import { AccordionDemo } from './examples/AccordionDemo'

// Avatar
import { AvatarDemo } from './examples/AvatarDemo'
import { AvatarSizes } from './examples/AvatarSizes'

// Button
import { ButtonDemo } from './examples/ButtonDemo'
import { ButtonAsALink } from './examples/ButtonAsALink'
import { ButtonDestructive } from './examples/ButtonDestructive'
import { ButtonGhost } from './examples/ButtonGhost'
import { ButtonIcon } from './examples/ButtonIcon'
import { ButtonLoading } from './examples/ButtonLoading'
import { ButtonOutline } from './examples/ButtonOutline'
import { ButtonWithIcon } from './examples/ButtonWithIcon'

// Calendar
import { CalendarDemo } from './examples/CalendarDemo'
import { CalendarControlled } from './examples/CalendarControlled'
import { CalendarMinMax } from './examples/CalendarMinMax'
import { CalendarUnstyled } from './examples/CalendarUnstyled'

// Checkbox
import { CheckboxDemo } from './examples/CheckboxDemo'
import { CheckboxDisabled } from './examples/CheckboxDisabled'
import { CheckboxForm } from './examples/CheckboxForm'
import { CheckboxGroupDemo } from './examples/CheckboxGroupDemo'
import { CheckboxIndeterminate } from './examples/CheckboxIndeterminate'

// Confirm Dialog
import { ConfirmDialogDemo } from './examples/ConfirmDialogDemo'
import { ConfirmDialogDestructive } from './examples/ConfirmDialogDestructive'

// DataTable
import { DataTableDemo } from './examples/DataTableDemo'
import { DataTableColumnAlignment } from './examples/DataTableColumnAlignment'
import { DataTableLoadingState } from './examples/DataTableLoadingState'
import { DataTableRealworld } from './examples/DataTableRealworld'
import { DataTableRowSelection } from './examples/DataTableRowSelection'
import { DataTableSorting } from './examples/DataTableSorting'
import { DataTableSticky } from './examples/DataTableSticky'

// DateField
import { DateFieldDemo } from './examples/DateFieldDemo'
import { DateFieldDisabled } from './examples/DateFieldDisabled'
import { DateFieldForm } from './examples/DateFieldForm'
import { DateFieldWithLabel } from './examples/DateFieldWithLabel'

// DatePicker
import { DatePickerDemo } from './examples/DatePickerDemo'
import { DatePickerDisabled } from './examples/DatePickerDisabled'
import { DatePickerForm } from './examples/DatePickerForm'
import { DatePickerWithLabel } from './examples/DatePickerWithLabel'

// DateRangePicker
import { DateRangePickerDemo } from './examples/DateRangePickerDemo'
import { DateRangePickerDisabled } from './examples/DateRangePickerDisabled'
import { DateRangePickerForm } from './examples/DateRangePickerForm'
import { DateRangePickerWithLabel } from './examples/DateRangePickerWithLabel'

// Dialog
import { DialogDemo } from './examples/DialogDemo'

// FileTrigger
import { FileTriggerDemo } from './examples/FileTriggerDemo'
import { FileTriggerAvatar } from './examples/FileTriggerAvatar'

// Input
import { InputDemo } from './examples/InputDemo'
import { InputDisabled } from './examples/InputDisabled'
import { InputFile } from './examples/InputFile'
import { InputForm } from './examples/InputForm'
import { InputWithButton } from './examples/InputWithButton'
import { InputWithLabel } from './examples/InputWithLabel'

// Loading
import { LoadingOverlayDemo } from './examples/LoadingOverlayDemo'

// Menu
import { MenuDemo } from './examples/MenuDemo'
import { MenuWithIcon } from './examples/MenuWithIcon'
import { MenuWithKeyboard } from './examples/MenuWithKeyboard'
import { MenuWithSubmenu } from './examples/MenuWithSubmenu'

// NProgress
import { NProgressDemo } from './examples/NProgressDemo'

// NumberField
import { NumberFieldDemo } from './examples/NumberFieldDemo'
import { NumberFieldCurrency } from './examples/NumberFieldCurrency'
import { NumberFieldDisabled } from './examples/NumberFieldDisabled'
import { NumberFieldForm } from './examples/NumberFieldForm'
import { NumberFieldMinMax } from './examples/NumberFieldMinMax'
import { NumberFieldPercentages } from './examples/NumberFieldPercentages'
import { NumberFieldUnits } from './examples/NumberFieldUnits'
import { NumberFieldWithLabel } from './examples/NumberFieldWithLabel'
import { NumberFieldWithoutStepper } from './examples/NumberFieldWithoutStepper'

// Pagination
import { PaginationDemo } from './examples/PaginationDemo'
import { PaginationWithPageSelector } from './examples/PaginationWithPageSelector'
import { PaginationWithQueryParams } from './examples/PaginationWithQueryParams'

// Popover
import { PopoverDemo } from './examples/PopoverDemo'
import { PopoverBottomRight } from './examples/PopoverBottomRight'

// RadioGroup
import { RadioGroupDemo } from './examples/RadioGroupDemo'
import { RadioGroupDisabled } from './examples/RadioGroupDisabled'
import { RadioGroupForm } from './examples/RadioGroupForm'
import { RadioGroupHorizontal } from './examples/RadioGroupHorizontal'

// RangeCalendar
import { RangeCalendarDemo } from './examples/RangeCalendarDemo'
import { RangeCalendarControlled } from './examples/RangeCalendarControlled'
import { RangeCalendarDefault } from './examples/RangeCalendarDefault'
import { RangeCalendarMinMax } from './examples/RangeCalendarMinMax'
import { RangeCalendarUnstyled } from './examples/RangeCalendarUnstyled'

// React Hook Form
import { RecFormBasic } from './examples/RecFormBasic'
import { RecFormValidation } from './examples/RecFormValidation'
import { RecFormWithLoading } from './examples/RecFormWithLoading'
import { RecFormConditionalFields } from './examples/RecFormConditionalFields'
import { RecFormFieldArray } from './examples/RecFormFieldArray'
import { RecFormSubmissionErrors } from './examples/RecFormSubmissionErrors'
import { RecFormLargeForm } from './examples/RecFormLargeForm'
import { RecDependantValidation } from './examples/RecDependantValidation'

// Select
import { SelectDemo } from './examples/SelectDemo'
import { SelectCustom } from './examples/SelectCustom'
import { SelectDisabled } from './examples/SelectDisabled'
import { SelectForm } from './examples/SelectForm'
import { SelectMultiple } from './examples/SelectMultiple'
import { SelectMultipleCustomization } from './examples/SelectMultipleCustomization'
import { SelectMultipleDisabled } from './examples/SelectMultipleDisabled'
import { SelectMultipleSearchable } from './examples/SelectMultipleSearchable'
import { SelectSearchable } from './examples/SelectSearchable'
import { SelectWithClearButton } from './examples/SelectWithClearButton'
import { TreeSelect } from './examples/TreeSelect'

// Separator
import { SeparatorDemo } from './examples/SeparatorDemo'

// Sheet
import { SheetDemo } from './examples/SheetDemo'

// Skeleton
import { SkeletonDemo } from './examples/SkeletonDemo'
import { SkeletonScreen } from './examples/SkeletonScreen'

// Sonner
import { SonnerDemo } from './examples/SonnerDemo'

// Spinner
import { SpinnerDemo } from './examples/SpinnerDemo'

// Switch
import { SwitchDemo } from './examples/SwitchDemo'
import { SwitchDisabled } from './examples/SwitchDisabled'
import { SwitchForm } from './examples/SwitchForm'

// Table
import { TableDemo } from './examples/TableDemo'

// TextArea
import { TextAreaDemo } from './examples/TextAreaDemo'
import { TextAreaDisabled } from './examples/TextAreaDisabled'
import { TextAreaForm } from './examples/TextAreaForm'
import { TextAreaWithButton } from './examples/TextAreaWithButton'
import { TextAreaWithLabel } from './examples/TextAreaWithLabel'

// TimeField
import { TimeFieldDemo } from './examples/TimeFieldDemo'
import { TimeFieldDisabled } from './examples/TimeFieldDisabled'
import { TimeFieldForm } from './examples/TimeFieldForm'
import { TimeFieldGranularity } from './examples/TimeFieldGranularity'
import { TimeFieldWithLabel } from './examples/TimeFieldWithLabel'

// Tooltip
import { TooltipDemo } from './examples/TooltipDemo'
import { TooltipBasic } from './examples/TooltipBasic'
import { TooltipCustom } from './examples/TooltipCustom'

// Uploader
import { UploaderDemo } from './examples/UploaderDemo'
import { UploaderCustom } from './examples/UploaderCustom'
import { UploaderDisabled } from './examples/UploaderDisabled'
import { UploaderForm } from './examples/UploaderForm'
import { UploaderRetry } from './examples/UploaderRetry'
import { UploaderValidation } from './examples/UploaderValidation'
import { UploaderVariantListType } from './examples/UploaderVariantListType'
import { UploaderVariantTriggerType } from './examples/UploaderVariantTriggerType'

interface ComponentExample {
    name: string
    component: React.ComponentType
    description?: string
}

const componentCategories: Record<string, ComponentExample[]> = {
    Button: [
        { name: 'Basic', component: ButtonDemo, description: 'Default button' },
        { name: 'Outline', component: ButtonOutline, description: 'Outline variant' },
        { name: 'Ghost', component: ButtonGhost, description: 'Ghost variant' },
        { name: 'Destructive', component: ButtonDestructive, description: 'Destructive action' },
        { name: 'Icon', component: ButtonIcon, description: 'Icon only button' },
        { name: 'With Icon', component: ButtonWithIcon, description: 'Button with icon' },
        { name: 'Loading', component: ButtonLoading, description: 'Loading state' },
        { name: 'As Link', component: ButtonAsALink, description: 'Button styled as link' },
    ],
    'Input Fields': [
        { name: 'Basic', component: InputDemo, description: 'Text input' },
        { name: 'With Label', component: InputWithLabel, description: 'Input with label' },
        { name: 'With Button', component: InputWithButton, description: 'Input with button' },
        { name: 'Disabled', component: InputDisabled, description: 'Disabled state' },
        { name: 'File Input', component: InputFile, description: 'File input' },
        { name: 'Form', component: InputForm, description: 'With form validation' },
    ],
    TextArea: [
        { name: 'Basic', component: TextAreaDemo, description: 'Multi-line text input' },
        { name: 'With Label', component: TextAreaWithLabel, description: 'TextArea with label' },
        { name: 'With Button', component: TextAreaWithButton, description: 'TextArea with button' },
        { name: 'Disabled', component: TextAreaDisabled, description: 'Disabled state' },
        { name: 'Form', component: TextAreaForm, description: 'With form validation' },
    ],
    'Number Field': [
        { name: 'Basic', component: NumberFieldDemo, description: 'Numeric input' },
        { name: 'With Label', component: NumberFieldWithLabel, description: 'With label' },
        { name: 'Min/Max', component: NumberFieldMinMax, description: 'Min/max constraints' },
        { name: 'Currency', component: NumberFieldCurrency, description: 'Currency format' },
        { name: 'Percentages', component: NumberFieldPercentages, description: 'Percentage format' },
        { name: 'Units', component: NumberFieldUnits, description: 'With units' },
        { name: 'Without Stepper', component: NumberFieldWithoutStepper, description: 'No steppers' },
        { name: 'Disabled', component: NumberFieldDisabled, description: 'Disabled state' },
        { name: 'Form', component: NumberFieldForm, description: 'With validation' },
    ],
    Checkbox: [
        { name: 'Basic', component: CheckboxDemo, description: 'Single checkbox' },
        { name: 'Group', component: CheckboxGroupDemo, description: 'Multiple checkboxes' },
        { name: 'Indeterminate', component: CheckboxIndeterminate, description: 'Indeterminate state' },
        { name: 'Disabled', component: CheckboxDisabled, description: 'Disabled state' },
        { name: 'Form', component: CheckboxForm, description: 'With form validation' },
    ],
    'Radio Group': [
        { name: 'Basic', component: RadioGroupDemo, description: 'Radio buttons' },
        { name: 'Horizontal', component: RadioGroupHorizontal, description: 'Horizontal layout' },
        { name: 'Disabled', component: RadioGroupDisabled, description: 'Disabled state' },
        { name: 'Form', component: RadioGroupForm, description: 'With form validation' },
    ],
    Switch: [
        { name: 'Basic', component: SwitchDemo, description: 'Toggle switch' },
        { name: 'Disabled', component: SwitchDisabled, description: 'Disabled state' },
        { name: 'Form', component: SwitchForm, description: 'With form validation' },
    ],
    Select: [
        { name: 'Basic', component: SelectDemo, description: 'Dropdown select' },
        { name: 'Searchable', component: SelectSearchable, description: 'With search' },
        { name: 'Multiple', component: SelectMultiple, description: 'Multi-select' },
        { name: 'Multiple Searchable', component: SelectMultipleSearchable, description: 'Multi-select with search' },
        { name: 'Tree Select', component: TreeSelect, description: 'Hierarchical tree selection' },
        { name: 'Custom', component: SelectCustom, description: 'Custom styling' },
        { name: 'With Clear', component: SelectWithClearButton, description: 'Clear button' },
        { name: 'Customization', component: SelectMultipleCustomization, description: 'Advanced customization' },
        { name: 'Disabled', component: SelectDisabled, description: 'Disabled state' },
        { name: 'Multiple Disabled', component: SelectMultipleDisabled, description: 'Multi-select disabled' },
        { name: 'Form', component: SelectForm, description: 'With validation' },
    ],
    Calendar: [
        { name: 'Basic', component: CalendarDemo, description: 'Date calendar' },
        { name: 'Controlled', component: CalendarControlled, description: 'Controlled state' },
        { name: 'Min/Max', component: CalendarMinMax, description: 'Date constraints' },
        { name: 'Unstyled', component: CalendarUnstyled, description: 'Unstyled version' },
    ],
    'Date Field': [
        { name: 'Basic', component: DateFieldDemo, description: 'Date input field' },
        { name: 'With Label', component: DateFieldWithLabel, description: 'With label' },
        { name: 'Disabled', component: DateFieldDisabled, description: 'Disabled state' },
        { name: 'Form', component: DateFieldForm, description: 'With validation' },
    ],
    'Date Picker': [
        { name: 'Basic', component: DatePickerDemo, description: 'Date picker with calendar' },
        { name: 'With Label', component: DatePickerWithLabel, description: 'With label' },
        { name: 'Disabled', component: DatePickerDisabled, description: 'Disabled state' },
        { name: 'Form', component: DatePickerForm, description: 'With validation' },
    ],
    'Date Range Picker': [
        { name: 'Basic', component: DateRangePickerDemo, description: 'Date range picker' },
        { name: 'With Label', component: DateRangePickerWithLabel, description: 'With label' },
        { name: 'Disabled', component: DateRangePickerDisabled, description: 'Disabled state' },
        { name: 'Form', component: DateRangePickerForm, description: 'With validation' },
    ],
    'Range Calendar': [
        { name: 'Basic', component: RangeCalendarDemo, description: 'Range calendar' },
        { name: 'Default', component: RangeCalendarDefault, description: 'Default state' },
        { name: 'Controlled', component: RangeCalendarControlled, description: 'Controlled state' },
        { name: 'Min/Max', component: RangeCalendarMinMax, description: 'Date constraints' },
        { name: 'Unstyled', component: RangeCalendarUnstyled, description: 'Unstyled version' },
    ],
    'Time Field': [
        { name: 'Basic', component: TimeFieldDemo, description: 'Time input' },
        { name: 'With Label', component: TimeFieldWithLabel, description: 'With label' },
        { name: 'Granularity', component: TimeFieldGranularity, description: 'Time granularity' },
        { name: 'Disabled', component: TimeFieldDisabled, description: 'Disabled state' },
        { name: 'Form', component: TimeFieldForm, description: 'With validation' },
    ],
    'Dialog & Modals': [
        { name: 'Dialog', component: DialogDemo, description: 'Modal dialog' },
        { name: 'Sheet', component: SheetDemo, description: 'Slide-out panel' },
        { name: 'Confirm Dialog', component: ConfirmDialogDemo, description: 'Confirmation modal' },
        { name: 'Confirm Destructive', component: ConfirmDialogDestructive, description: 'Destructive confirm' },
    ],
    'Popover & Tooltip': [
        { name: 'Popover', component: PopoverDemo, description: 'Floating content' },
        { name: 'Popover Position', component: PopoverBottomRight, description: 'Custom position' },
        { name: 'Tooltip', component: TooltipDemo, description: 'Hover tooltip' },
        { name: 'Tooltip Basic', component: TooltipBasic, description: 'Basic tooltip' },
        { name: 'Tooltip Custom', component: TooltipCustom, description: 'Custom tooltip' },
    ],
    Menu: [
        { name: 'Basic', component: MenuDemo, description: 'Dropdown menu' },
        { name: 'With Icon', component: MenuWithIcon, description: 'Menu with icons' },
        { name: 'With Submenu', component: MenuWithSubmenu, description: 'Nested menu' },
        { name: 'With Keyboard', component: MenuWithKeyboard, description: 'Keyboard shortcuts' },
    ],
    'Data Table': [
        { name: 'Basic', component: DataTableDemo, description: 'Simple table' },
        { name: 'Real World', component: DataTableRealworld, description: 'Full-featured table' },
        { name: 'Sorting', component: DataTableSorting, description: 'Sortable columns' },
        { name: 'Row Selection', component: DataTableRowSelection, description: 'Select rows' },
        { name: 'Column Alignment', component: DataTableColumnAlignment, description: 'Column alignment' },
        { name: 'Loading State', component: DataTableLoadingState, description: 'Loading state' },
        { name: 'Sticky Header', component: DataTableSticky, description: 'Sticky header' },
    ],
    Table: [{ name: 'Basic', component: TableDemo, description: 'Simple HTML table' }],
    Display: [
        { name: 'Accordion', component: AccordionDemo, description: 'Collapsible sections' },
        { name: 'Avatar', component: AvatarDemo, description: 'User avatar' },
        { name: 'Avatar Sizes', component: AvatarSizes, description: 'Different sizes' },
        { name: 'Separator', component: SeparatorDemo, description: 'Visual divider' },
    ],
    Feedback: [
        { name: 'Loading Overlay', component: LoadingOverlayDemo, description: 'Full screen loading' },
        { name: 'Spinner', component: SpinnerDemo, description: 'Loading spinner' },
        { name: 'Skeleton', component: SkeletonDemo, description: 'Skeleton loader' },
        { name: 'Skeleton Screen', component: SkeletonScreen, description: 'Full skeleton' },
        { name: 'Toast', component: SonnerDemo, description: 'Toast notifications' },
        { name: 'Progress Bar', component: NProgressDemo, description: 'Top progress bar' },
    ],
    'File Upload': [
        { name: 'Uploader', component: UploaderDemo, description: 'File uploader' },
        { name: 'Custom', component: UploaderCustom, description: 'Custom uploader' },
        { name: 'Trigger Type', component: UploaderVariantTriggerType, description: 'Trigger variants' },
        { name: 'List Type', component: UploaderVariantListType, description: 'List variants' },
        { name: 'With Retry', component: UploaderRetry, description: 'Retry failed uploads' },
        { name: 'Validation', component: UploaderValidation, description: 'File validation' },
        { name: 'Disabled', component: UploaderDisabled, description: 'Disabled state' },
        { name: 'Form', component: UploaderForm, description: 'With form validation' },
        { name: 'File Trigger', component: FileTriggerDemo, description: 'File input trigger' },
        { name: 'Avatar Upload', component: FileTriggerAvatar, description: 'Avatar upload' },
    ],
    Pagination: [
        { name: 'Basic', component: PaginationDemo, description: 'Page navigation' },
        { name: 'With Page Selector', component: PaginationWithPageSelector, description: 'Page selector' },
        { name: 'With Query Params', component: PaginationWithQueryParams, description: 'URL params' },
    ],
    'React Hook Form': [
        { name: 'Basic Form', component: RecFormBasic, description: 'Basic form example' },
        { name: 'Validation', component: RecFormValidation, description: 'Form validation' },
        { name: 'With Loading', component: RecFormWithLoading, description: 'Loading state' },
        { name: 'Conditional Fields', component: RecFormConditionalFields, description: 'Conditional rendering' },
        { name: 'Field Array', component: RecFormFieldArray, description: 'Dynamic fields' },
        { name: 'Submission Errors', component: RecFormSubmissionErrors, description: 'Server errors' },
        { name: 'Large Form', component: RecFormLargeForm, description: 'Complex form' },
        { name: 'Dependent Validation', component: RecDependantValidation, description: 'Dependent fields' },
    ],
}

export function ComponentsShowcase() {
    const { t } = useTranslation()
    const [selectedCategory, setSelectedCategory] = useState<string>('Button')
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Button']))
    const totalComponents = Object.values(componentCategories).reduce((acc, items) => acc + items.length, 0)

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(category)) {
            newExpanded.delete(category)
        } else {
            newExpanded.add(category)
        }
        setExpandedCategories(newExpanded)
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <Button asChild variant="ghost" size="sm" className="mb-4">
                    <Link to="/">
                        <ArrowLeft className="size-4" />
                        {t('common.backToHome')}
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold mb-2">{t('components.title')}</h1>
                <p className="text-muted-foreground text-lg">
                    {t('components.description', {
                        count: totalComponents,
                        categories: Object.keys(componentCategories).length,
                    })}
                </p>
            </div>

            {/* Main Content: Sidebar + Content */}
            <div className="flex gap-6">
                {/* Sidebar Menu */}
                <aside className="w-64 flex-shrink-0">
                    <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                        <nav className="space-y-1">
                            {Object.entries(componentCategories).map(([category, items]) => {
                                const isExpanded = expandedCategories.has(category)
                                const isSelected = selectedCategory === category

                                return (
                                    <div key={category}>
                                        {/* Category Header */}
                                        <button
                                            onClick={() => {
                                                toggleCategory(category)
                                                setSelectedCategory(category)
                                            }}
                                            className={cn(
                                                'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                                'hover:bg-muted',
                                                isSelected && 'bg-muted text-foreground',
                                                !isSelected && 'text-muted-foreground',
                                            )}
                                        >
                                            <ChevronRight
                                                className={cn('size-4 transition-transform', isExpanded && 'rotate-90')}
                                            />
                                            <span className="flex-1 text-left">{category}</span>
                                            <span className="text-xs opacity-60">{items.length}</span>
                                        </button>

                                        {/* Subcategory Items */}
                                        {isExpanded && (
                                            <div className="ml-6 mt-1 space-y-0.5 border-l border-border pl-3">
                                                {items.map(item => (
                                                    <div
                                                        key={item.name}
                                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 cursor-default"
                                                    >
                                                        {item.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </nav>
                    </ScrollArea>
                </aside>

                {/* Content Area */}
                <main className="flex-1">
                    <ScrollArea className="h-[calc(100vh-250px)]">
                        <div className="pr-4">
                            {Object.entries(componentCategories).map(
                                ([category, components]) =>
                                    selectedCategory === category && (
                                        <div key={category}>
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold mb-2">{category}</h2>
                                                <p className="text-muted-foreground">
                                                    {components.length} example{components.length > 1 && 's'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {components.map(({ name, component: Component, description }) => (
                                                    <Card key={name} className="p-6 flex flex-col">
                                                        <div className="mb-4">
                                                            <h3 className="text-lg font-semibold mb-1">{name}</h3>
                                                            {description && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 flex items-center justify-center p-8 bg-muted/30 rounded-md min-h-[120px]">
                                                            <Component />
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ),
                            )}
                        </div>
                    </ScrollArea>
                </main>
            </div>
        </div>
    )
}
