// pages/admin/users.jsx
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import { RiSearchLine, RiUserForbidLine, RiCheckLine, RiShieldLine } from 'react-icons/ri';

const MOCK_USERS = [
  { uid: 'u1',  name: 'Rahul Mehta',   email: 'rahul@ex.com',  phone: '9876543210', plan: 'premium', bookings: 12, createdAt: '2024-11-01', isBlocked: false },
  { uid: 'u2',  name: 'Arjun Das',     email: 'arjun@ex.com',  phone: '9876543211', plan: 'free',    bookings: 3,  createdAt: '2024-12-10', isBlocked: false },
  { uid: 'u3',  name: 'Priya Singh',   email: 'priya@ex.com',  phone: '9876543212', plan: 'premium', bookings: 8,  createdAt: '2024-10-15', isBlocked: false },
  { uid: 'u4',  name: 'Vikram Nair',   email: 'vikram@ex.com', phone: '9876543213', plan: 'free',    bookings: 1,  createdAt: '2025-01-05', isBlocked: false },
  { uid: 'u5',  name: 'Kiran Joshi',   email: 'kiran@ex.com',  phone: '9876543214', plan: 'free',    bookings: 0,  createdAt: '2025-01-10', isBlocked: true  },
  { uid: 'u6',  name: 'Sanjay Reddy',  email: 'sanjay@ex.com', phone: '9876543215', plan: 'free',    bookings: 5,  createdAt: '2024-09-20', isBlocked: false },
];

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState(MOCK_USERS);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  const filtered = users.filter(u => {
    if (filter === 'premium' && u.plan !== 'premium') return false;
    if (filter === 'blocked' && !u.isBlocked) return false;
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.email.includes(q)) return false;
    return true;
  });

  const toggleBlock = (uid, cur) => {
    setUsers(p => p.map(u => u.uid === uid ? { ...u, isBlocked: !cur } : u));
    toast.success(cur ? 'User unblocked' : 'User blocked');
  };

  const counts = {
    all:     users.length,
    premium: users.filter(u => u.plan === 'premium').length,
    blocked: users.filter(u => u.isBlocked).length,
  };

  return (
    <AdminLayout title="Users Management">
      <Head><title>Users – Admin</title></Head>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 p-1 glass rounded-xl">
          {Object.entries(counts).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === k ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:text-white'}`}>
              {k} ({v})
            </button>
          ))}
        </div>
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="glass-input pl-9 w-56 text-sm" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Bookings</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.uid}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                      <span className="text-sm font-medium text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-xs text-gray-400">{u.email}</td>
                  <td className="text-xs font-mono text-gray-400">{u.phone}</td>
                  <td><span className={u.plan === 'premium' ? 'badge-premium' : 'text-xs text-gray-500'}>{u.plan}</span></td>
                  <td className="text-sm text-white font-semibold">{u.bookings}</td>
                  <td className="text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                  <td>
                    {u.isBlocked
                      ? <span className="status-rejected">Blocked</span>
                      : <span className="status-approved">Active</span>}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleBlock(u.uid, u.isBlocked)}
                      className={`flex items-center gap-1 text-xs transition-colors ${u.isBlocked ? 'text-emerald-400 hover:text-emerald-300' : 'text-rose-400 hover:text-rose-300'}`}
                    >
                      {u.isBlocked ? <><RiCheckLine /> Unblock</> : <><RiUserForbidLine /> Block</>}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-600">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
