// Read receipt component: single ✓ (sent), double ✓✓ (delivered), blue ✓✓ (read)

import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/lib/firestore";

interface Props {
  message: Message;
  chatMembers: string[];
  currentUid: string;
}

export default function MessageStatus({ message, chatMembers, currentUid }: Props) {
  if (message.senderId !== currentUid) return null;

  const otherMembers = chatMembers.filter((m) => m !== currentUid);
  const allRead = otherMembers.every((m) => message.readBy?.includes(m));
  const allDelivered = otherMembers.every((m) => message.deliveredTo?.includes(m));

  if (allRead) {
    return <CheckCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  }
  if (allDelivered) {
    return <CheckCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
  }
  return <Check className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
}
