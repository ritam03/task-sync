import { Link } from 'react-router-dom';
import { 
  CheckCircle, Layout, Users, Zap, Shield, ArrowRight, 
  Activity, Layers, Clock, MessageSquare 
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
              T
            </div>
            <span className="text-xl font-bold text-gray-900">TaskSync</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative isolate pt-14 pb-20 overflow-hidden">
        {/* Background Gradient Blob */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
           <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
              Manage projects with <span className="text-indigo-600">military-grade precision</span>.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 mb-8">
              TaskSync isn't just a todo list. It's a <strong>Multi-Tenant Workspace</strong> system with 
              real-time WebSocket synchronization, strict Role-Based Access Control (RBAC), and 
              granular Activity Audit Logs. Built for teams that demand transparency.
            </p>
            <div className="flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-500 hover:-translate-y-1 transition-all duration-200"
              >
                Start Collaborating <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600 transition-colors">
                View Live Demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Enterprise Ready</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              A complete operating system for your work
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              
              {/* Feature 1: Sockets */}
              <div className="flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <Zap className="h-6 w-6 text-indigo-600" />
                  </div>
                  Real-Time Sockets
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Zero-latency updates. Drag a card, rename a list, or delete a task, and your team sees it instantly without refreshing. Powered by Socket.io.
                  </p>
                </dd>
              </div>

              {/* Feature 2: RBAC */}
              <div className="flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <Shield className="h-6 w-6 text-indigo-600" />
                  </div>
                  Strict RBAC Permissions
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Not everyone is an Admin. Owners manage workspaces, Admins delete boards, and Members collaborate. Secure permissions at every API endpoint.
                  </p>
                </dd>
              </div>

              {/* Feature 3: Activity Logs */}
              <div className="flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <Activity className="h-6 w-6 text-indigo-600" />
                  </div>
                  Granular Audit Logs
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    "Who moved that card?" Now you know. Detailed timeline of every action—creation, movement, renames, and comments—with context-aware badges.
                  </p>
                </dd>
              </div>

              {/* Feature 4: Multi-Tenancy */}
              <div className="flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <Layers className="h-6 w-6 text-indigo-600" />
                  </div>
                  Multi-Workspace Support
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Isolate your Engineering, Marketing, and Sales work. Create multiple workspaces and switch between them seamlessly from the sidebar.
                  </p>
                </dd>
              </div>

              {/* Feature 5: Rich Tasks */}
              <div className="flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <Clock className="h-6 w-6 text-indigo-600" />
                  </div>
                  Rich Task Details
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Add context with descriptions, set strict due dates, and visualize timelines. Tasks aren't just sticky notes; they are detailed records.
                  </p>
                </dd>
              </div>

              {/* Feature 6: Collaboration */}
              <div className="flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <MessageSquare className="h-6 w-6 text-indigo-600" />
                  </div>
                  Contextual Comments
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Discuss work where it happens. Comment directly on cards to keep conversations focused and actionable, separate from your Slack noise.
                  </p>
                </dd>
              </div>

            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to synchronize your team?
              <br />
              Start using TaskSync today.
            </h2>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Get started for free
              </Link>
              <Link to="/register" className="text-sm font-semibold leading-6 text-gray-900">
                Create an account <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 lg:px-8">
          <p className="text-center text-xs leading-5 text-gray-500">
            &copy; 2026 TaskSync Inc. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;