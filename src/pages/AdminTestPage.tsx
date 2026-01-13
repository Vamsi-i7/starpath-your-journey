// DEBUG PAGE - Remove after testing
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, isAdminEmail } from '@/lib/adminAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function AdminTestPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Debug Info</h1>
        
        <div className="space-y-3 text-sm">
          <div>
            <strong>User Email:</strong> {user?.email || 'Not logged in'}
          </div>
          
          <div>
            <strong>Profile Email:</strong> {profile?.email || 'No profile'}
          </div>
          
          <div>
            <strong>Is Admin Email:</strong> {isAdminEmail(user?.email).toString()}
          </div>
          
          <div>
            <strong>Profile is_admin flag:</strong> {profile?.is_admin?.toString() || 'undefined'}
          </div>
          
          <div>
            <strong>isAdmin(profile) result:</strong> {isAdmin(profile).toString()}
          </div>
          
          <div className="pt-4">
            <strong>Full Profile Object:</strong>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button onClick={() => navigate('/app/settings')} className="w-full">
            Go to Settings
          </Button>
          
          {isAdmin(profile) && (
            <Button onClick={() => navigate('/app/admin/verify')} variant="secondary" className="w-full">
              Go to Admin Verify
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
