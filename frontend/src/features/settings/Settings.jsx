import { User, Key, Bell, Shield } from 'lucide-react';

export const Settings = () => {
  return (
    <div className="max-w-4xl space-y-8 pb-10">
      
      {/* Profile Section */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-border p-6 flex items-center gap-3">
          <User className="text-accent w-5 h-5" />
          <h2 className="text-lg font-medium text-primary">Profile Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Full Name</label>
              <input 
                type="text" 
                defaultValue="Engineer" 
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Email Address</label>
              <input 
                type="email" 
                defaultValue="engineer@startup.ai" 
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
          <button className="bg-primary text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Save Changes
          </button>
        </div>
      </section>

      {/* API Key Management */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-border p-6 flex items-center gap-3">
          <Key className="text-accent w-5 h-5" />
          <h2 className="text-lg font-medium text-primary">API Configuration</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted mb-4">
            Manage your OpenAI or Anthropic API keys used by the Agent Workflow.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">OpenAI API Key</label>
            <div className="flex gap-3">
              <input 
                type="password" 
                defaultValue="sk-proj-********************************" 
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-sm"
              />
              <button className="bg-surfaceHover border border-border text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-border transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Preferences */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-border p-6 flex items-center gap-3">
            <Shield className="text-accent w-5 h-5" />
            <h2 className="text-lg font-medium text-primary">Security</h2>
          </div>
          <div className="p-6">
            <button className="w-full bg-background border border-border text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-surfaceHover transition-colors mb-3">
              Change Password
            </button>
            <button className="w-full bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
              Enable Two-Factor Auth
            </button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-border p-6 flex items-center gap-3">
            <Bell className="text-accent w-5 h-5" />
            <h2 className="text-lg font-medium text-primary">Notifications</h2>
          </div>
          <div className="p-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-accent bg-background border-border rounded" />
              <span className="text-sm text-primary">Email me when a scan completes</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-accent bg-background border-border rounded" />
              <span className="text-sm text-primary">Weekly security report</span>
            </label>
          </div>
        </div>
      </section>

    </div>
  );
};