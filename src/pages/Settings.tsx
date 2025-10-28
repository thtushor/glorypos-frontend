const Settings: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <div className="max-w-2xl space-y-6">
        {/* Profile Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Profile Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Your Business Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="your@email.com"
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">System Settings</h2>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-brand-primary" />
              <span>Enable email notifications</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-brand-primary" />
              <span>Enable SMS notifications</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button className="px-4 py-2 bg-brand-primary text-white rounded-md">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
