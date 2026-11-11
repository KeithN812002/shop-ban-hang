'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useController, useFormContext, type Control, type RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
    Bold,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    RemoveFormatting,
    Strikethrough,
    Underline as UnderlineIcon,
} from 'lucide-react'
import { Label } from '@workspace/ui/components/Field'
import { Separator } from '@workspace/ui/components/Separator'
import { Toggle } from '@workspace/ui/components/Toggle'
import { Tooltip, TooltipTrigger } from '@workspace/ui/components/Tooltip'
import { cn } from '@workspace/ui/lib/utils'
import {
    getFieldHighlightControlClass,
    getFieldHighlightLabelClass,
    getFieldHighlightMessageClass,
    type FieldHighlightVariant,
} from '@workspace/ui/lib/fieldHighlight'

const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i
const NON_BREAKING_SPACE = String.fromCharCode(160)

// Email clients apply large default margins to block elements, so inline
// margin:0 to keep the sent email tight like the editor shows it.
const normalizeHtmlForEmail = (html: string): string => {
    if (!html || typeof document === 'undefined') return html
    const doc = new DOMParser().parseFromString(html, 'text/html')
    doc.querySelectorAll<HTMLElement>('p, ul, ol, li, h1, h2, h3, blockquote').forEach(el => {
        el.style.margin = '0'
        if (el.tagName === 'P' && el.childNodes.length === 0) {
            el.appendChild(doc.createTextNode(NON_BREAKING_SPACE))
        }
    })
    return doc.body.innerHTML
}

function ToolbarButton({
    label,
    icon,
    isActive,
    onPress,
}: {
    label: string
    icon: ReactNode
    isActive?: boolean
    onPress: () => void
}) {
    return (
        <TooltipTrigger delay={300}>
            <Toggle size="sm" aria-label={label} isSelected={isActive} onPress={onPress}>
                {icon}
            </Toggle>
            <Tooltip>{label}</Tooltip>
        </TooltipTrigger>
    )
}

export interface BsRichTextEditorProps {
    label?: string
    isRequired?: boolean
    errorMessage?: string
    name: string
    control?: Control<any>
    rules?: RegisterOptions
    containerClassName?: string
    isDisabled?: boolean
    fieldHighlight?: FieldHighlightVariant
    highlightMessage?: string
}

export function BsRichTextEditor({
    label,
    isRequired,
    errorMessage,
    name,
    control,
    rules,
    containerClassName,
    isDisabled = false,
    fieldHighlight,
    highlightMessage,
}: BsRichTextEditorProps) {
    const { t } = useTranslation()
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

    const { field, fieldState } = useController({
        name,
        control: resolvedControl,
        rules: {
            ...(isRequired
                ? {
                      required: t('forms.validation.required', { label: label ?? t('common.field') }),
                  }
                : {}),
            ...(rules ?? {}),
            validate: (value: unknown, formValues: any): any => {
                const raw = String(value ?? '')
                if (SCRIPT_TAG_REGEX.test(raw)) {
                    return t('forms.validation.noScript', {
                        defaultValue: 'Nội dung không được chứa thẻ script.',
                    })
                }

                const userValidate = rules?.validate
                if (!userValidate) return true

                if (typeof userValidate === 'function') {
                    return userValidate(value, formValues)
                }

                if (typeof userValidate === 'object') {
                    const validators = userValidate as Record<string, (v: unknown, values: unknown) => unknown>
                    for (const key of Object.keys(validators)) {
                        const res = validators[key]?.(value, formValues)
                        if (res !== true) return res
                    }
                }

                return true
            },
        },
    })
    const { onChange, value: fieldValue } = field
    const lastHtmlRef = useRef<string>(fieldValue ?? '')

    const editor = useEditor({
        editable: !isDisabled,
        extensions: [
            StarterKit.configure({
                link: {
                    openOnClick: false,
                    autolink: true,
                    HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
                },
            }),
        ],
        content: fieldValue ?? '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none dark:prose-invert min-h-[250px] px-3 py-2 focus:outline-none prose-p:my-0 prose-headings:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0 prose-blockquote:my-0',
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.isEmpty ? '' : normalizeHtmlForEmail(editor.getHTML())
            lastHtmlRef.current = html
            onChange(html)
        },
    })

    const toolbar = useEditorState({
        editor,
        selector: ({ editor }: { editor: Editor | null }) => ({
            bold: editor?.isActive('bold') ?? false,
            italic: editor?.isActive('italic') ?? false,
            underline: editor?.isActive('underline') ?? false,
            strike: editor?.isActive('strike') ?? false,
            link: editor?.isActive('link') ?? false,
            bulletList: editor?.isActive('bulletList') ?? false,
            orderedList: editor?.isActive('orderedList') ?? false,
            h1: editor?.isActive('heading', { level: 1 }) ?? false,
            h2: editor?.isActive('heading', { level: 2 }) ?? false,
            h3: editor?.isActive('heading', { level: 3 }) ?? false,
        }),
    })

    // Sync editable state
    useEffect(() => {
        editor?.setEditable(!isDisabled)
    }, [editor, isDisabled])

    // Sync value from react-hook-form external updates (initial load, resets)
    useEffect(() => {
        if (!editor) return
        const incoming = fieldValue ?? ''
        if (incoming === lastHtmlRef.current) return
        lastHtmlRef.current = incoming
        editor.commands.setContent(incoming, { emitUpdate: false })
    }, [editor, fieldValue])

    if (!resolvedControl) {
        return null
    }

    const setLink = () => {
        if (!editor) return
        const previous = editor.getAttributes('link').href as string | undefined
        const url = window.prompt(t('common.richTextEditor.linkPrompt'), previous ?? '')
        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    const errMsg = fieldState.error?.message || errorMessage
    const hasError = !!errMsg
    const activeHighlight = !hasError ? fieldHighlight : undefined

    return (
        <div className={cn('group/field flex flex-col gap-1.5', containerClassName)}>
            {label && (
                <Label
                    data-invalid={hasError ? true : undefined}
                    className={cn(
                        'group-focus-within/field:text-primary transition-colors relative flex items-center gap-1 w-fit max-w-full overflow-hidden',
                        hasError && 'text-destructive!',
                        activeHighlight && getFieldHighlightLabelClass(activeHighlight),
                    )}
                >
                    <span>{label}</span>
                    {isRequired && <span className="text-destructive flex-shrink-0">*</span>}
                </Label>
            )}
            <div className="flex flex-col">
                <div
                    className={cn(
                        'ring ring-input ring-inset rounded-sm bg-background overflow-hidden transition-colors',
                        hasError
                            ? 'ring-2 ring-destructive bg-destructive/10'
                            : 'focus-within:ring-2 focus-within:ring-primary focus-within:bg-primary/5',
                        isDisabled && 'opacity-80 bg-muted',
                        activeHighlight && getFieldHighlightControlClass(activeHighlight),
                    )}
                >
                    {!isDisabled && editor && (
                        <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1">
                            <ToolbarButton
                                label={t('common.richTextEditor.heading1')}
                                icon={<Heading1 className="size-4" />}
                                isActive={toolbar?.h1}
                                onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            />
                            <ToolbarButton
                                label={t('common.richTextEditor.heading2')}
                                icon={<Heading2 className="size-4" />}
                                isActive={toolbar?.h2}
                                onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            />
                            <ToolbarButton
                                label={t('common.richTextEditor.heading3')}
                                icon={<Heading3 className="size-4" />}
                                isActive={toolbar?.h3}
                                onPress={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            />
                            <Separator orientation="vertical" className="mx-1 h-6" />
                            <ToolbarButton
                                label={t('common.richTextEditor.bold')}
                                icon={<Bold className="size-4" />}
                                isActive={toolbar?.bold}
                                onPress={() => editor.chain().focus().toggleBold().run()}
                            />
                            <ToolbarButton
                                label={t('common.richTextEditor.italic')}
                                icon={<Italic className="size-4" />}
                                isActive={toolbar?.italic}
                                onPress={() => editor.chain().focus().toggleItalic().run()}
                            />
                            <ToolbarButton
                                label={t('common.richTextEditor.underline')}
                                icon={<UnderlineIcon className="size-4" />}
                                isActive={toolbar?.underline}
                                onPress={() => editor.chain().focus().toggleUnderline().run()}
                            />
                            <ToolbarButton
                                label={t('common.richTextEditor.strike')}
                                icon={<Strikethrough className="size-4" />}
                                isActive={toolbar?.strike}
                                onPress={() => editor.chain().focus().toggleStrike().run()}
                            />
                            <ToolbarButton
                                label={t('common.richTextEditor.link')}
                                icon={<LinkIcon className="size-4" />}
                                isActive={toolbar?.link}
                                onPress={setLink}
                            />
                            <Separator orientation="vertical" className="mx-1 h-6" />
                            <ToolbarButton
                                label={t('common.richTextEditor.bulletList')}
                                icon={<List className="size-4" />}
                                isActive={toolbar?.bulletList}
                                onPress={() => editor.chain().focus().toggleBulletList().run()}
                            />
                            <ToolbarButton
                                label={t('common.richTextEditor.orderedList')}
                                icon={<ListOrdered className="size-4" />}
                                isActive={toolbar?.orderedList}
                                onPress={() => editor.chain().focus().toggleOrderedList().run()}
                            />
                            <Separator orientation="vertical" className="mx-1 h-6" />
                            <ToolbarButton
                                label={t('common.richTextEditor.clearFormat')}
                                icon={<RemoveFormatting className="size-4" />}
                                onPress={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                            />
                        </div>
                    )}
                    <EditorContent editor={editor} />
                </div>
                {errMsg && <p className="text-xs text-destructive mt-1">{errMsg}</p>}
                {!errMsg && highlightMessage && fieldHighlight && (
                    <p className={cn('text-xs mt-1', getFieldHighlightMessageClass(fieldHighlight))}>
                        {highlightMessage}
                    </p>
                )}
            </div>
        </div>
    )
}
