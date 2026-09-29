import { useAuth } from '../context/AuthContext.jsx';
import { ProfileEditor, ProfileView } from '../pages/Account.jsx';

export default function AdminProfile() {
  const { user } = useAuth();
  return <div className="max-w-2xl space-y-8"><h1 className="text-3xl">My Profile</h1><ProfileView user={user} /><ProfileEditor redirect="/admin/profile" /></div>;
}
