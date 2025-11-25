/**
 * 管理画面ルートページ
 * /admin
 * 
 * ログインページにリダイレクト
 */

import { redirect } from "next/navigation";

const AdminPage = () => {
  redirect("/admin/login");
};

export default AdminPage;

