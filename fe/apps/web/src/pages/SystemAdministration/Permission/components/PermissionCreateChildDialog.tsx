import { useTranslation } from 'react-i18next'
import { LayoutList, Menu, PanelsTopLeft } from 'lucide-react'
import { DialogContent, DialogHeader, DialogTitle, DialogBody } from '@workspace/ui/components/Dialog'
import { PermissionTypeEnum } from '@/constants/options'

interface PermissionCreateChildDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onStartCreate: (type: PermissionTypeEnum.GROUP | PermissionTypeEnum.MENU | PermissionTypeEnum.PAGE) => void
    parentType?: PermissionTypeEnum | null
}

export function PermissionCreateChildDialog({
    isOpen,
    onOpenChange,
    onStartCreate,
    parentType,
}: PermissionCreateChildDialogProps) {
    const { t } = useTranslation()

    return (
        <DialogContent isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false}>
            <DialogHeader>
                <DialogTitle>{t('permission.dialog.createChildTitle')}</DialogTitle>
            </DialogHeader>
            <DialogBody>
                <div className="flex items-center justify-center gap-8 py-4">
                    {parentType === PermissionTypeEnum.MENU || parentType === PermissionTypeEnum.PAGE ? (
                        <button
                            type="button"
                            onClick={() => onStartCreate(PermissionTypeEnum.PAGE)}
                            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/40 transition-all duration-200 cursor-pointer min-w-[120px]"
                        >
                            <div className="p-3 rounded-full bg-muted/60">
                                <PanelsTopLeft className="size-8 text-indigo-500" />
                            </div>
                            <span className="text-sm font-medium">{t('permission.typeLabels.page')}</span>
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => onStartCreate(PermissionTypeEnum.GROUP)}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/40 transition-all duration-200 cursor-pointer min-w-[120px]"
                            >
                                <div className="p-3 rounded-full bg-muted/60">
                                    <LayoutList className="size-8 text-amber-500" />
                                </div>
                                <span className="text-sm font-medium">{t('permission.typeLabels.group')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onStartCreate(PermissionTypeEnum.MENU)}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/40 transition-all duration-200 cursor-pointer min-w-[120px]"
                            >
                                <div className="p-3 rounded-full bg-muted/60">
                                    <Menu className="size-8 text-blue-500" />
                                </div>
                                <span className="text-sm font-medium">{t('permission.typeLabels.menu')}</span>
                            </button>
                        </>
                    )}
                </div>
            </DialogBody>
        </DialogContent>
    )
}
