import {
    Ban,
    Bell,
    CheckCircle,
    Edit,
    Eye,
    FolderOpen,
    Inbox,
    KeyRound,
    Lock,
    Pause,
    Reply,
    Send,
    Settings,
    ShieldCheck,
    Trash2,
    Unlock,
    XCircle,
    type LucideIcon,
} from 'lucide-react'

export type ActionType =
    | 'view'
    | 'edit'
    | 'delete'
    | 'lock'
    | 'unlock'
    | 'receive'
    | 'reply'
    | 'reopen'
    | 'verify'
    | 'process'
    | 'send'
    | 'reject'
    | 'close'
    | 'suspend'
    | 'notify'
    | 'resetPassword'
    | 'custom'

export function getActionIcon(type: ActionType): LucideIcon {
    switch (type) {
        case 'view':
            return Eye
        case 'edit':
            return Edit
        case 'delete':
            return Trash2
        case 'unlock':
            return Unlock
        case 'lock':
            return Lock
        case 'receive':
            return Inbox
        case 'reply':
            return Reply
        case 'reopen':
            return FolderOpen
        case 'verify':
            return CheckCircle
        case 'process':
            return ShieldCheck
        case 'send':
            return Send
        case 'reject':
            return Ban
        case 'close':
            return XCircle
        case 'suspend':
            return Pause
        case 'notify':
            return Bell
        case 'resetPassword':
            return KeyRound
        default:
            return Settings
    }
}

export function getActionColor(type: ActionType): string {
    switch (type) {
        case 'edit':
            return 'text-blue-500'
        case 'delete':
            return 'text-red-500'
        case 'unlock':
            return 'text-green-500'
        case 'lock':
            return 'text-amber-500'
        case 'receive':
            return 'text-emerald-500'
        case 'reply':
            return 'text-indigo-500'
        case 'reopen':
            return 'text-amber-500'
        case 'verify':
            return 'text-green-500'
        case 'process':
            return 'text-blue-500'
        case 'reject':
            return 'text-slate-500'
        case 'close':
            return 'text-red-500'
        case 'suspend':
            return 'text-orange-500'
        case 'notify':
            return 'text-violet-500'
        case 'resetPassword':
            return 'text-amber-600 hover:text-amber-700'
        default:
            return 'text-slate-500'
    }
}
