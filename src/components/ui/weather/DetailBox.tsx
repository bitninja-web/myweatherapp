import React from "react";
export const DetailBox = React.memo(({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5 rounded-2xl bg-black/5 dark:bg-white/5 p-3 sm:p-4 border border-white/5">
    <div className="flex items-center gap-2 opacity-40">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-base sm:text-lg font-bold tracking-tight">{value}</span>
  </div>
));
DetailBox.displayName = "DetailBox";