import { useEffect, useMemo, useState } from 'react';
import { Eye, MoreVertical, Plus, Trash2, TrendingUp, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, type UserDto } from '@/api/userApi';
import { toApiErrorMessage } from '@/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ProgressRing } from '@/components/ProgressRing';
import { toast } from 'sonner';

type UserStatus = 'active' | 'inactive';

type ViewUser = {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'employee';
  department: string;
  status: UserStatus;
  productivity: number;
  totalHours: number;
  joinedDate: string;
  companyId?: string | null;
  companyName?: string | null;
  adminName?: string | null;
};

const toViewUser = (apiUser: UserDto): ViewUser => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  role: apiUser.role,
  department: 'General',
  status: apiUser.status === 'active' ? 'active' : 'inactive',
  productivity: apiUser.productivity ?? 0,
  totalHours: apiUser.totalHours ?? 0,
  joinedDate: new Date(apiUser.createdAt).toISOString().split('T')[0],
  companyId: apiUser.companyId ?? null,
  companyName: apiUser.companyName ?? null,
  adminName: apiUser.createdByName ?? null
});

export default function AdminUsers() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  const [users, setUsers] = useState<ViewUser[]>([]);
  const [admins, setAdmins] = useState<ViewUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<ViewUser | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'employee',
    companyName: '',
    ownerId: '',
    status: 'active' as UserStatus
  });

  const ownerOptions = useMemo(
    () => admins.filter((admin) => admin.companyId),
    [admins]
  );

  const loadUsers = async () => {
    try {
      if (isSuperAdmin) {
        const [adminRows, employeeRows] = await Promise.all([userApi.listAdmins(), userApi.listEmployees()]);
        setAdmins(adminRows.map(toViewUser));
        setUsers(employeeRows.map(toViewUser));
        return;
      }

      if (isAdmin) {
        const employeeRows = await userApi.listCompanyEmployees();
        setAdmins([]);
        setUsers(employeeRows.map(toViewUser));
        return;
      }

      setAdmins([]);
      setUsers([]);
    } catch (error) {
      toast.error('Failed to load users', {
        description: toApiErrorMessage(error),
      });
    }
  };

  useEffect(() => {
    if (user) {
      void loadUsers();
    }
  }, [user]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setNewUser((prev) => ({ ...prev, role: 'employee', ownerId: '' }));
      return;
    }

    setNewUser((prev) => ({
      ...prev,
      ownerId: prev.ownerId || ownerOptions[0]?.id || ''
    }));
  }, [isSuperAdmin, ownerOptions]);

  const filteredUsers = users.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || item.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredAdmins = admins.filter((admin) => {
    const needle = searchQuery.toLowerCase();
    return (
      admin.name.toLowerCase().includes(needle) ||
      admin.email.toLowerCase().includes(needle) ||
      (admin.companyName || '').toLowerCase().includes(needle)
    );
  });

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSuperAdmin) {
        if (newUser.role === 'admin') {
          if (!newUser.companyName.trim()) {
            toast.error('Company name is required for admin creation');
            setIsSubmitting(false);
            return;
          }

          await userApi.createAdmin({
            name: newUser.name.trim(),
            email: newUser.email.trim(),
            companyName: newUser.companyName.trim()
          });
        } else {
          const owner = ownerOptions.find((admin) => admin.id === newUser.ownerId);
          if (!owner?.companyId) {
            toast.error('Select a company owner for this employee');
            setIsSubmitting(false);
            return;
          }

          await userApi.createEmployeeAsSuperAdmin({
            name: newUser.name.trim(),
            email: newUser.email.trim(),
            companyId: owner.companyId,
            createdBy: owner.id
          });
        }
      } else if (isAdmin) {
        await userApi.createEmployee({
          name: newUser.name.trim(),
          email: newUser.email.trim()
        });
      } else {
        toast.error('You do not have permission to create users.');
        setIsSubmitting(false);
        return;
      }

      toast.success('User created successfully');
      setShowCreateModal(false);
      setNewUser({
        name: '',
        email: '',
        role: 'employee',
        companyName: '',
        ownerId: ownerOptions[0]?.id || '',
        status: 'active'
      });
      await loadUsers();
    } catch (error) {
      toast.error('Failed to create user', {
        description: toApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (target: ViewUser) => {
    if (isSuperAdmin) {
      toast.info('Status changes are currently supported for company admins through company-scoped employee management.');
      return;
    }

    try {
      await userApi.updateEmployee(target.id, {
        status: target.status === 'active' ? 'suspended' : 'active'
      });
      toast.success(`User ${target.status === 'active' ? 'deactivated' : 'activated'} successfully`);
      await loadUsers();
    } catch (error) {
      toast.error('Failed to update user', {
        description: toApiErrorMessage(error),
      });
    }
  };

  const handleDelete = async (id: string, role: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    try {
      if (isSuperAdmin) {
        if (role === 'admin') {
          await userApi.deleteAdmin(id);
        } else {
          await userApi.deleteEmployeeAsSuperAdmin(id);
        }
      } else if (isAdmin) {
        await userApi.deleteEmployee(id);
      } else {
        toast.error('You do not have permission to delete this user.');
        return;
      }

      toast.success('User deleted successfully');
      await loadUsers();
    } catch (error) {
      toast.error('Failed to delete user', {
        description: toApiErrorMessage(error),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Users</h2>
          <p className="text-muted-foreground">Manage employees, admins, and company access.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus size={16} />
          Add User
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isSuperAdmin ? (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">Admins</h3>
              <p className="text-sm text-muted-foreground">All company owners across the platform.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Company</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Created</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="border-b border-border last:border-0 table-row-hover">
                      <td className="p-4 text-sm font-medium text-foreground">{admin.name}</td>
                      <td className="p-4 text-sm text-foreground">{admin.companyName || '-'}</td>
                      <td className="p-4 text-sm text-foreground">{admin.email}</td>
                      <td className="p-4 text-sm text-foreground">{new Date(admin.joinedDate).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(admin.id, admin.role)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">Employees</h3>
              <p className="text-sm text-muted-foreground">All employees across all companies.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Company</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Admin</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 table-row-hover">
                      <td className="p-4 text-sm font-medium text-foreground">{item.name}</td>
                      <td className="p-4 text-sm text-foreground">{item.companyName || '-'}</td>
                      <td className="p-4 text-sm text-foreground">{item.adminName || '-'}</td>
                      <td className="p-4 text-sm text-foreground">{item.email}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, item.role)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Department</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Role</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Productivity</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Hours</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 table-row-hover">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{item.department}</td>
                    <td className="p-4 text-sm text-foreground capitalize">{item.role}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                        item.status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'active' ? 'bg-success' : 'bg-destructive'}`} />
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${item.productivity}%` }} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{item.productivity}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{item.totalHours}h</td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUser(item); setShowDetails(true); }}>
                            <Eye size={14} className="mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <TrendingUp size={14} className="mr-2" />
                            Productivity View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(item)}
                            className={item.status === 'active' ? 'text-destructive' : 'text-success'}
                          >
                            {item.status === 'active' ? (
                              <>
                                <UserX size={14} className="mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} className="mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(item.id, item.role)} className="text-destructive">
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSuperAdmin ? 'Create User' : 'Create Employee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>

            {isSuperAdmin ? (
              <>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(value: 'admin' | 'employee') => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newUser.role === 'employee' && (
                  <div className="space-y-2">
                    <Label>Company Owner</Label>
                    <Select value={newUser.ownerId} onValueChange={(value) => setNewUser({ ...newUser, ownerId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {ownerOptions.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name} - {owner.companyName || 'No company'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newUser.role === 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                      id="company-name"
                      placeholder="Enter company name"
                      value={newUser.companyName}
                      onChange={(e) => setNewUser({ ...newUser, companyName: e.target.value })}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value="Employee" disabled />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateUser} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium text-foreground">{selectedUser.department}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize text-foreground">{selectedUser.role}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`font-medium ${selectedUser.status === 'active' ? 'text-success' : 'text-destructive'}`}>
                    {selectedUser.status}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium text-foreground">{selectedUser.joinedDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ProgressRing value={selectedUser.productivity} size={140} label="Productivity" />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setShowDetails(false)}>Close</Button>
                {!isSuperAdmin && (
                  <Button
                    variant={selectedUser.status === 'active' ? 'destructive' : 'default'}
                    className="flex-1"
                    onClick={() => {
                      void handleToggleStatus(selectedUser);
                      setShowDetails(false);
                    }}
                  >
                    {selectedUser.status === 'active' ? 'Deactivate User' : 'Activate User'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
