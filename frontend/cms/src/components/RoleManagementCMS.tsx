import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Stethoscope, 
  Lock, 
  Check, 
  X, 
  Edit2, 
  Save, 
  Zap,
  Key,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { CMSUser, UserRole } from '../types';

interface RoleManagementCMSProps {
  cmsUsers: CMSUser[];
  activeUser: CMSUser;
  onUpdateRole: (userId: string, role: UserRole, permissions: CMSUser['permissions']) => void;
  onDeleteUser?: (userId: string) => void;
}

export const RoleManagementCMS: React.FC<RoleManagementCMSProps> = ({
  cmsUsers,
  activeUser,
  onUpdateRole,
  onDeleteUser
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState<UserRole>('doctor');
  const [editedPermissions, setEditedPermissions] = useState<CMSUser['permissions']>({
    manageSlots: true,
    editSchedule: true,
    manageRoles: false,
    viewMedicalRecords: true,
    cancelAppointments: true,
    emergencyOverride: true
  });

  const canManageRoles = activeUser.permissions.manageRoles || activeUser.role === 'admin';

  const startEditing = (user: CMSUser) => {
    setEditingUserId(user.id);
    setEditedRole(user.role);
    setEditedPermissions({ ...user.permissions });
  };

  const handleSave = (userId: string) => {
    onUpdateRole(userId, editedRole, editedPermissions);
    setEditingUserId(null);
  };

  const permissionLabels: { key: keyof CMSUser['permissions']; label: string; desc: string }[] = [
    { key: 'manageSlots', label: 'Slot Control', desc: 'Add, block, or release appointment time slots' },
    { key: 'editSchedule', label: 'Schedule Admin', desc: 'Modify doctor working hours & slot durations' },
    { key: 'manageRoles', label: 'User & Role Access', desc: 'Manage CMS user roles and permission matrices' },
    { key: 'viewMedicalRecords', label: 'Clinical Records', desc: 'View patient medical histories & clinical notes' },
    { key: 'cancelAppointments', label: 'Booking Cancellation', desc: 'Cancel or reschedule existing appointments' },
    { key: 'emergencyOverride', label: 'Emergency Override', desc: 'Issue immediate emergency blocks across clinic slots' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">CMS Role & Access Management</h2>
              <p className="text-xs text-slate-500">Configure access rights and operational permissions across hospital staff in real time</p>
            </div>
          </div>
        </div>

        {!canManageRoles && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Read-Only Mode: Log in as System Admin to modify role matrices</span>
          </div>
        )}
      </div>

      {/* Users Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-xl">User & Staff Profile</th>
              <th className="py-3 px-4">Role Title</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Active Permissions</th>
              <th className="py-3 px-4 text-right rounded-r-xl">CMS Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {cmsUsers.map((user) => {
              const isEditing = editingUserId === user.id;

              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* User Profile */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-slate-500 text-[11px]">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role Title */}
                  <td className="py-4 px-4">
                    {isEditing ? (
                      <select
                        value={editedRole}
                        onChange={(e) => setEditedRole(e.target.value as UserRole)}
                        className="px-2.5 py-1.5 rounded-lg border border-blue-400 bg-white font-semibold text-xs text-slate-800 focus:outline-hidden"
                      >
                        <option value="doctor">Doctor</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="admin">System Admin</option>
                        <option value="patient">Patient</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        user.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                        user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'receptionist' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role === 'doctor' && <Stethoscope className="w-3 h-3" />}
                        {user.role === 'receptionist' && <UserCheck className="w-3 h-3" />}
                        {user.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                        {user.role}
                      </span>
                    )}
                  </td>

                  {/* Department */}
                  <td className="py-4 px-4 font-medium text-slate-600">
                    {user.department || 'General Clinic'}
                  </td>

                  {/* Permissions Chips */}
                  <td className="py-4 px-4 max-w-xs">
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        {permissionLabels.map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editedPermissions[key]}
                              onChange={(e) => setEditedPermissions({ ...editedPermissions, [key]: e.target.checked })}
                              className="rounded-sm text-blue-600 focus:ring-blue-500"
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {permissionLabels.map(({ key, label }) => {
                          const hasPerm = user.permissions[key];
                          if (!hasPerm) return null;
                          return (
                            <span key={key} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                              ✓ {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* Action Button */}
                  <td className="py-4 px-4 text-right">
                    {canManageRoles ? (
                      isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSave(user.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEditing(user)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3 text-slate-600" /> Modify Access
                          </button>
                          {onDeleteUser && user.id !== activeUser.id && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove staff member ${user.name}?`)) {
                                  onDeleteUser(user.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="text-slate-400 text-xs italic flex items-center justify-end gap-1">
                        <Lock className="w-3 h-3" /> Restricted
                      </span>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
