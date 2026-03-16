import { Settings } from "lucide-react";

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
        </div>
        <p className="text-gray-500 text-sm">
          Site configuration and general settings will be available here.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Languages</h2>
        <p className="text-gray-500 text-sm mb-4">Supported languages for the website content.</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-700">Hebrew (HE)</span>
            <span className="text-xs text-blue-500">Default</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Arabic (AR)</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Roles</h2>
        <p className="text-gray-500 text-sm mb-4">User role definitions and permissions.</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
            <span className="text-sm font-medium text-red-700">Admin</span>
            <span className="text-xs text-red-500">Full access to all admin features</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-sm font-medium text-blue-700">Worker</span>
            <span className="text-xs text-blue-500">Orders + Inventory only</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <span className="text-sm font-medium text-green-700">Customer</span>
            <span className="text-xs text-green-500">Frontend only (account, orders, addresses)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
