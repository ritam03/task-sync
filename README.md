# TaskSync 🚀

TaskSync is an enterprise-grade Project Management System designed for agile teams. It features real-time collaboration, strict Role-Based Access Control (RBAC), and granular activity auditing, similar to Trello or Jira.

## ✨ Key Features

* **⚡ Real-Time Collaboration:** Instant updates across all clients using **Socket.io**. Drag cards, add lists, or rename items—teammates see it instantly.
* **🏢 Multi-Tenant Workspaces:** Users can create and manage multiple isolated workspaces.
* **🛡️ Strict RBAC:** * **Owners:** Manage workspace lifecycle.
    * **Admins:** Manage boards and invite members.
    * **Members:** View and edit tasks based on permissions.
* **📝 Granular Activity Logs:** Industry-standard audit trails tracking every move, rename, comment, and creation with context-aware badges.
* **📊 Rich Kanban Boards:** Drag-and-drop interface powered by `@hello-pangea/dnd`.
* **💬 Contextual Collaboration:** Comments, due dates, and rich descriptions on every task.

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Socket.io Client.
* **Backend:** Node.js, Express.js, Socket.io Server.
* **Database:** PostgreSQL, Prisma ORM.
* **Auth:** JWT (JSON Web Tokens).