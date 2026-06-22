import AdminRouteHeader from "./components/AdminRouteHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className="min-h-screen bg-gray-50">
        <AdminRouteHeader
          hideOn={[
            "/admin/quizzes/create",
            "/admin/quizzes/edit",
            "/admin/quizzes/preview",
          ]}
        />
        {children}
      </div>
  );
}
