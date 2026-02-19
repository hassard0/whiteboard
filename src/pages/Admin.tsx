import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useNavigate } from "react-router-dom";
import {
  Users, Plus, Mail, Pencil, Trash2, Search, RefreshCw, UserPlus, ShieldAlert, ShieldCheck, Shield,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Auth0User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  last_login?: string;
  created_at: string;
  email_verified: boolean;
  logins_count?: number;
  blocked?: boolean;
}

// Hardcoded — Auth0 Management API audience for this tenant
const AUTH0_MGMT_AUDIENCE = "https://ian-h0001.us.auth0.com/api/v2/";

// Role actions only need the user's own Auth0 token (no mgmt audience)
const ROLE_ACTIONS = ["set-role"];

async function callAdminApi(
  getAccessToken: (opts?: object) => Promise<string>,
  method: string,
  action: string,
  body?: object
) {
  const needsMgmtAudience = !ROLE_ACTIONS.includes(action);
  const token = await getAccessToken(
    needsMgmtAudience
      ? { authorizationParams: { audience: AUTH0_MGMT_AUDIENCE } }
      : {}
  );
  const url = `${SUPABASE_URL}/functions/v1/admin-users?action=${action}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function formatLastLogin(dateStr?: string) {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPage() {
  const { getAccessTokenSilently } = useAuth0();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  const [users, setUsers] = useState<Auth0User[]>([]);
  const [adminSubs, setAdminSubs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [promotingId, setPromotingId] = useState<string | null>(null);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<Auth0User | null>(null);
  const [deleteUser, setDeleteUser] = useState<Auth0User | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAdminRoles = useCallback(async () => {
    const { data } = await supabase.from("user_roles").select("auth0_sub").eq("role", "admin");
    if (data) setAdminSubs(new Set(data.map((r) => r.auth0_sub)));
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [apiData] = await Promise.all([
        callAdminApi(getAccessTokenSilently, "GET", "list"),
        loadAdminRoles(),
      ]);
      setUsers(apiData.users || apiData);
    } catch (err: any) {
      toast({ title: "Failed to load users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, loadAdminRoles]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/");
    if (!adminLoading && isAdmin) loadUsers();
  }, [isAdmin, adminLoading]);

  const resetForm = () => { setFormEmail(""); setFormName(""); setFormPassword(""); };

  const handleToggleAdmin = async (u: Auth0User) => {
    const isCurrentlyAdmin = adminSubs.has(u.user_id);
    setPromotingId(u.user_id);
    try {
      await callAdminApi(getAccessTokenSilently, "POST", "set-role", {
        userId: u.user_id,
        role: "admin",
        grant: !isCurrentlyAdmin,
      });
      if (isCurrentlyAdmin) {
        setAdminSubs((prev) => { const next = new Set(prev); next.delete(u.user_id); return next; });
        toast({ title: "Admin revoked", description: `${u.email} is no longer an admin.` });
      } else {
        setAdminSubs((prev) => new Set([...prev, u.user_id]));
        toast({ title: "Admin granted", description: `${u.email} is now an admin.` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPromotingId(null);
    }
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await callAdminApi(getAccessTokenSilently, "POST", "create", {
        email: formEmail,
        name: formName,
        password: formPassword || undefined,
      });
      toast({ title: "User created", description: `${formEmail} has been created.` });
      setCreateOpen(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async () => {
    setSubmitting(true);
    try {
      await callAdminApi(getAccessTokenSilently, "POST", "invite", {
        email: formEmail,
        name: formName,
      });
      toast({ title: "Invitation sent", description: `An invite email was sent to ${formEmail}.` });
      setInviteOpen(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSubmitting(true);
    try {
      await callAdminApi(getAccessTokenSilently, "PATCH", "update", {
        userId: editUser.user_id,
        name: formName || editUser.name,
        email: formEmail || editUser.email,
      });
      toast({ title: "User updated" });
      setEditUser(null);
      resetForm();
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSubmitting(true);
    try {
      await callAdminApi(getAccessTokenSilently, "DELETE", "delete", {
        userId: deleteUser.user_id,
      });
      toast({ title: "User deleted", description: `${deleteUser.email} has been removed.` });
      setDeleteUser(null);
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (adminLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="pointer-events-none absolute left-0 right-0 top-16 h-72 z-0" style={{
        background: "radial-gradient(ellipse at 50% 0%, hsl(262 80% 50% / 0.15) 0%, transparent 70%)",
      }} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Admin Area</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">User Management</h1>
            <p className="mt-1 text-muted-foreground">Manage Auth0 users and admin roles for this application.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              className="rounded-full border-border/60"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-border/60"
              onClick={() => { resetForm(); setInviteOpen(true); }}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Invite User
            </Button>
            <Button
              size="sm"
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
              onClick={() => { resetForm(); setCreateOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create User
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: users.length, icon: Users },
            { label: "Admins", value: adminSubs.size, icon: ShieldCheck },
            { label: "Active (30d)", value: users.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 30 * 86400000)).length, icon: RefreshCw },
            { label: "Blocked", value: users.filter(u => u.blocked).length, icon: ShieldAlert },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <stat.icon className="h-4 w-4" />
                    <span className="text-xs">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No users found.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredUsers.map((u, i) => {
                  const userIsAdmin = adminSubs.has(u.user_id);
                  return (
                    <motion.div
                      key={u.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-primary/20 shrink-0 flex items-center justify-center">
                        {u.picture ? (
                          <img src={u.picture} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-primary">
                            {(u.name || u.email || "?")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      {/* Badges */}
                      <div className="hidden md:flex items-center gap-2 shrink-0">
                        {userIsAdmin && (
                          <Badge className="text-xs gap-1 bg-primary/15 text-primary border-primary/30 border">
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </Badge>
                        )}
                        {u.email_verified ? (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Unverified</Badge>
                        )}
                        {u.blocked && <Badge variant="destructive" className="text-xs">Blocked</Badge>}
                      </div>
                      {/* Last login */}
                      <div className="hidden lg:block text-right shrink-0 w-28">
                        <p className="text-xs text-muted-foreground">{formatLastLogin(u.last_login)}</p>
                        {u.logins_count !== undefined && (
                          <p className="text-xs text-muted-foreground/60">{u.logins_count} logins</p>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Promote / Revoke admin */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${userIsAdmin ? "text-primary hover:text-destructive" : "text-muted-foreground hover:text-primary"}`}
                          title={userIsAdmin ? "Revoke admin" : "Promote to admin"}
                          disabled={promotingId === u.user_id}
                          onClick={() => handleToggleAdmin(u)}
                        >
                          {promotingId === u.user_id ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : userIsAdmin ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditUser(u);
                            setFormName(u.name || "");
                            setFormEmail(u.email || "");
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteUser(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create User Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email *</Label>
              <Input id="c-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Full Name</Label>
              <Input id="c-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-pass">Password</Label>
              <Input id="c-pass" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Leave blank to auto-generate" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formEmail || submitting} className="bg-foreground text-background hover:bg-foreground/90">
              {submitting ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            The user will receive an Auth0 invite email to set their password and activate their account.
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="i-email">Email *</Label>
              <Input id="i-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="invitee@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-name">Full Name</Label>
              <Input id="i-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Jane Doe" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!formEmail || submitting} className="bg-foreground text-background hover:bg-foreground/90">
              <Mail className="h-4 w-4 mr-1.5" />
              {submitting ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) { setEditUser(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="e-email">Email</Label>
              <Input id="e-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-name">Full Name</Label>
              <Input id="e-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditUser(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={submitting} className="bg-foreground text-background hover:bg-foreground/90">
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => { if (!o) setDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteUser?.email}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
