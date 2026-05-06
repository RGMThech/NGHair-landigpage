import { Check, X } from "lucide-react";
import { passwordRules } from "@/lib/password-rules";

export const PasswordRulesChecklist = ({ password }: { password: string }) => (
  <ul className="space-y-1 text-xs">
    {passwordRules.map((r) => {
      const ok = r.test(password);
      return (
        <li
          key={r.key}
          className={`flex items-center gap-2 ${ok ? "text-green-600" : "text-muted-foreground"}`}
        >
          {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          <span>{r.label}</span>
        </li>
      );
    })}
  </ul>
);