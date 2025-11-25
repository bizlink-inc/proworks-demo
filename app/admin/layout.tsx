/**
 * 管理画面レイアウト
 * /admin 配下の共通レイアウト
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProWorks Admin - 案件マッチング管理",
  description: "案件と人材のマッチング管理画面",
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[var(--pw-bg-sidebar)]">
      {children}
    </div>
  );
};

export default AdminLayout;

