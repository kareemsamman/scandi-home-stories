import { Package, ShoppingBag, Users, FileText } from "lucide-react";

const stats = [
  { label: "Total Orders", value: "156", icon: ShoppingBag, change: "+12%" },
  { label: "Products", value: "34", icon: Package, change: "+3" },
  { label: "Customers", value: "89", icon: Users, change: "+8" },
  { label: "Pages", value: "3", icon: FileText, change: "" },
];

const AdminDashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                {stat.change && (
                  <span className="text-xs font-medium text-green-600 mb-1">{stat.change}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome to AMG Admin</h2>
        <p className="text-sm text-gray-500">
          This is your admin dashboard. Use the sidebar to manage users, products, orders, pages, and media.
        </p>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Phase 1 Complete:</strong> Authentication, user roles, and admin layout are ready.
            Next phases will add product management, orders, page builder, and media library.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
