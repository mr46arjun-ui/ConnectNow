import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";

interface MessageDeletionProps {
  messageId: string;
  onDelete?: (messageId: string) => void;
  canDelete?: boolean;
  isOwnMessage?: boolean;
}

export default function MessageDeletion({
  messageId,
  onDelete,
  canDelete = true,
  isOwnMessage = false,
}: MessageDeletionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You cannot delete this message");
      return;
    }

    setLoading(true);
    try {
      onDelete?.(messageId);
      toast.success("Message deleted successfully");
      setShowDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete message");
    } finally {
      setLoading(false);
    }
  };

  if (!canDelete || !isOwnMessage) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 hover:bg-red-600/10 hover:text-red-400"
        onClick={() => setShowDialog(true)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="bg-slate-900 border-purple-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Message?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. The message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-slate-800 hover:bg-slate-700 text-white border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Message context menu component for showing delete option
interface MessageContextMenuProps {
  messageId: string;
  isOwnMessage?: boolean;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
}

export function MessageContextMenu({
  messageId,
  isOwnMessage = false,
  onDelete,
  onEdit,
  onReply,
  onForward,
}: MessageContextMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 hover:bg-slate-700"
        onClick={() => setShowMenu(!showMenu)}
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </Button>

      {showMenu && (
        <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 min-w-40">
          {onReply && (
            <button
              onClick={() => {
                onReply(messageId);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-gray-300 first:rounded-t-lg"
            >
              Reply
            </button>
          )}
          {onForward && (
            <button
              onClick={() => {
                onForward(messageId);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-gray-300"
            >
              Forward
            </button>
          )}
          {isOwnMessage && onEdit && (
            <button
              onClick={() => {
                onEdit(messageId);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-gray-300"
            >
              Edit
            </button>
          )}
          {isOwnMessage && onDelete && (
            <button
              onClick={() => {
                onDelete(messageId);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-red-600/10 text-sm text-red-400 last:rounded-b-lg"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
