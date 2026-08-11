import { Check, CheckCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ReadReceipt {
  userId: number;
  username: string;
  readAt: string;
}

interface ReadReceiptsProps {
  status: "sent" | "delivered" | "read";
  readReceipts?: ReadReceipt[];
}

export default function ReadReceipts({ status, readReceipts = [] }: ReadReceiptsProps) {
  if (status === "sent") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Check className="w-4 h-4 text-slate-400" />
        </TooltipTrigger>
        <TooltipContent>Sent</TooltipContent>
      </Tooltip>
    );
  }

  if (status === "delivered") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCheck className="w-4 h-4 text-slate-400" />
        </TooltipTrigger>
        <TooltipContent>Delivered</TooltipContent>
      </Tooltip>
    );
  }

  // Read status
  if (readReceipts.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCheck className="w-4 h-4 text-blue-500" />
        </TooltipTrigger>
        <TooltipContent>Read</TooltipContent>
      </Tooltip>
    );
  }

  // Multiple read receipts
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1">
          <CheckCheck className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-slate-400">{readReceipts.length}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          {readReceipts.map((receipt) => (
            <div key={receipt.userId} className="text-xs">
              <p className="font-semibold">{receipt.username}</p>
              <p className="text-slate-300">{new Date(receipt.readAt).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
