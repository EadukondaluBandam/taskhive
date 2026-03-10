import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toApiErrorMessage } from '@/api/client';
import { userApi, type CompanyDto, type UserDto } from '@/api/userApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';

export default function AdminUsers() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [admins, setAdmins] = useState<UserDto[]>([]);
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'employee',
  });

  const companyOptions = useMemo(
    () => companies.map((company) => ({ label: company.name, value: company.id })),
    [companies]
  );

  const loadData = async () => {
    try {
      if (isSuperadmin) {
        const [companyRows, adminRows, employeeRows] = await Promise.all([
          userApi.listCompanies(),
          userApi.listAdmins(),
          userApi.listEmployees(),
        ]);
        setCompanies(companyRows);
        setAdmins(adminRows);
        setEmployees(employeeRows);
      } else {
        const employeeRows = await userApi.listCompanyEmployees();
        setEmployees(employeeRows);
      }
    } catch (error) {
      toast.error('Failed to load users', {
        description: toApiErrorMessage(error),
      });
    }
  };

  useEffect(() => {
    if (user) {
      void loadData();
    }
  }, [user]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Name, email, and password are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSuperadmin) {
        toast.error('Superadmin admin creation is handled through company registration in this build.');
      } else {
        await userApi.createEmployee({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password
        });
        toast.success('Employee created successfully');
        setShowCreateModal(false);
        setForm({ name: '', email: '', password: '', role: 'employee' });
        await loadData();
      }
    } catch (error) {
      toast.error('Failed to create user', {
        description: toApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (target: UserDto) => {
    if (!window.confirm(`Delete ${target.name}?`)) return;

    try {
      if (isSuperadmin) {
        if (target.role === 'admin') {
          await userApi.deleteAdmin(target.id);
        } else {
          await userApi.deleteEmployeeAsSuperadmin(target.id);
        }
      } else {
        await userApi.deleteEmployee(target.id);
      }

      toast.success('User deleted successfully');
      await loadData();
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
          <p className="text-muted-foreground">
            {isSuperadmin ? 'Global visibility across companies, admins, and employees.' : 'Manage employees in your company.'}
          </p>
        </div>
        {!isSuperadmin && (
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus size={16} />
            Add Employee
          </Button>
        )}
      </div>

      {isSuperadmin && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Companies</p>
            <p className="text-2xl font-semibold text-foreground">{companies.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-2xl font-semibold text-foreground">{admins.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Employees</p>
            <p className="text-2xl font-semibold text-foreground">{employees.length}</p>
          </div>
        </div>
      )}

      {isSuperadmin && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="text-lg font-semibold text-foreground">Companies</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Company</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Users</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Projects</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm font-medium text-foreground">{company.name}</td>
                  <td className="p-4 text-sm text-foreground">{company._count?.users ?? 0}</td>
                  <td className="p-4 text-sm text-foreground">{company._count?.projects ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isSuperadmin && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="text-lg font-semibold text-foreground">Admins</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Company</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm font-medium text-foreground">{admin.name}</td>
                  <td className="p-4 text-sm text-foreground">{admin.companyName || '-'}</td>
                  <td className="p-4 text-sm text-foreground">{admin.email}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => void handleDelete(admin)}>
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-lg font-semibold text-foreground">Employees</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">Company</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">Email</th>
              <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b border-border last:border-0">
                <td className="p-4 text-sm font-medium text-foreground">{employee.name}</td>
                <td className="p-4 text-sm text-foreground">{employee.companyName || user?.companyName || '-'}</td>
                <td className="p-4 text-sm text-foreground">{employee.email}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" onClick={() => void handleDelete(employee)}>
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
            </div>
            {isSuperadmin && (
              <div className="space-y-2">
                <Label>Company</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Company selection disabled in this screen" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyOptions.map((company) => (
                      <SelectItem key={company.value} value={company.value}>
                        {company.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void handleCreate()} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
