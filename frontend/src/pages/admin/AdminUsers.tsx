import { useState, useEffect } from 'react';
import { Search, MoreVertical, UserCheck, UserX, Eye, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/lib/types';
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

export default function AdminUsers() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state for new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'employee',
    department: 'Development',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (user) {
      void loadUsers();
    }
  }, [user]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setNewUser((prev) => ({ ...prev, role: 'employee' }));
    }
  }, [isSuperAdmin]);

  const mapApiUserToViewUser = (apiUser: UserDto): User => ({
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role as User['role'],
    department: 'General',
    status: apiUser.status === 'active' ? 'active' : 'inactive',
    productivity: 0,
    totalHours: 0,
    joinedDate: new Date(apiUser.createdAt).toISOString().split('T')[0],
    adminName: apiUser.adminName || undefined
  });

  const loadUsers = async () => {
    try {
      if (isSuperAdmin) {
        const [admins, employees] = await Promise.all([userApi.listAdmins(), userApi.listEmployees()]);
        setAdmins(admins.map(mapApiUserToViewUser));
        setUsers(employees.map(mapApiUserToViewUser));
      } else if (isAdmin) {
        const employees = await userApi.listMyEmployees();
        setUsers(employees.map(mapApiUserToViewUser));
      } else {
        setUsers([]);
        setAdmins([]);
      }
    } catch (error) {
      toast.error('Failed to load users', {
        description: toApiErrorMessage(error),
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (isSuperAdmin) {
        await userApi.createUser({
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          role: newUser.role
        });
      } else if (isAdmin) {
        await userApi.createEmployee({
          name: newUser.name.trim(),
          email: newUser.email.trim()
        });
      } else {
        throw new Error('Not allowed');
      }

      toast.success('User created successfully');
      setShowCreateModal(false);
      setNewUser({
        name: '',
        email: '',
        role: 'employee',
        department: 'Development',
        status: 'active'
      });
      await loadUsers();
    } catch (error) {
      toast.error('Failed to create user', {
        description: toApiErrorMessage(error),
      });
    }
  };

  const handleToggleStatus = (user: User) => {
    toast.info(`Status change for ${user.name} is not implemented yet.`);
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
        throw new Error('Not allowed');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Users</h2>
          <p className="text-muted-foreground">Manage employee accounts and access</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus size={16} />
          Add User
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card"
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
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Admins</h3>
              <p className="text-sm text-muted-foreground">Manage admin users across the system.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="border-b border-border last:border-0 table-row-hover">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{admin.name}</p>
                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">{admin.email}</td>
                      <td className="p-4 text-sm text-foreground">{new Date(admin.joinedDate).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(admin.id, admin.role)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Employees</h3>
              <p className="text-sm text-muted-foreground">Manage employees across the system.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Admin</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 table-row-hover">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">{user.adminName || '—'}</td>
                      <td className="p-4 text-sm text-foreground">{user.email}</td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id, user.role)}
                        >
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
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Department</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Productivity</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Hours</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 table-row-hover">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{user.department}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'active' ? 'bg-success' : 'bg-destructive'
                        }`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${user.productivity}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground">{user.productivity}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{user.totalHours}h</td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowDetails(true); }}>
                            <Eye size={14} className="mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <TrendingUp size={14} className="mr-2" />
                            Productivity View
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(user)}
                            className={user.status === 'active' ? 'text-destructive' : 'text-success'}
                          >
                            {user.status === 'active' ? (
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
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.id, user.role)}
                            className="text-destructive"
                          >
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

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
              {isSuperAdmin ? (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(v: 'admin' | 'employee') => setNewUser({ ...newUser, role: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value="Employee" disabled />
                </div>
              )}

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={newUser.department} onValueChange={(v) => setNewUser({ ...newUser, department: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newUser.status} onValueChange={(v: 'active' | 'inactive') => setNewUser({ ...newUser, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateUser}>
                Create User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium text-foreground">{selectedUser.department}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium text-foreground capitalize">{selectedUser.role}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`font-medium ${selectedUser.status === 'active' ? 'text-success' : 'text-destructive'}`}>
                    {selectedUser.status}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium text-foreground">{selectedUser.joinedDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ProgressRing value={selectedUser.productivity} size={140} label="Productivity" />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setShowDetails(false)}>Close</Button>
                <Button 
                  variant={selectedUser.status === 'active' ? 'destructive' : 'default'} 
                  className="flex-1"
                  onClick={() => {
                    handleToggleStatus(selectedUser);
                    setShowDetails(false);
                  }}
                >
                  {selectedUser.status === 'active' ? 'Deactivate User' : 'Activate User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
