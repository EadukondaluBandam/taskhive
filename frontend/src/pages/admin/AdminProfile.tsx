import { Building2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminProfile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Profile</h2>
        <p className="text-muted-foreground">Core account information for your company workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound size={18} />
              Name
            </CardTitle>
          </CardHeader>
          <CardContent>{user?.name || '-'}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail size={18} />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>{user?.email || '-'}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 size={18} />
              Company
            </CardTitle>
          </CardHeader>
          <CardContent>{user?.companyName || '-'}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck size={18} />
              Role
            </CardTitle>
          </CardHeader>
          <CardContent className="capitalize">{user?.role || '-'}</CardContent>
        </Card>
      </div>
    </div>
  );
}
