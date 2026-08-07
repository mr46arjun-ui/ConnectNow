import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Shield,
  FolderPlus,
  Trash2,
  UserCheck,
  UserCog,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { LoadingState, ErrorState, EmptyState, SkeletonLoader } from "@/components/LoadingState";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // State for creating group
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupPass, setNewGroupPass] = useState("");

  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading, error: statsError } = trpc.admin.getStats.useQuery(undefined, { enabled: Boolean(user) });
  const { data: onlineUsers, isLoading: usersLoading, error: usersError } = trpc.admin.getOnlineUsers.useQuery(undefined, { enabled: Boolean(user) });
  const { data: allUsers, isLoading: allUsersLoading } = trpc.admin.listAllUsers.useQuery(undefined, { enabled: Boolean(user) });
  const { data: groupsList, isLoading: groupsLoading } = trpc.admin.listGroups.useQuery(undefined, { enabled: Boolean(user) });
  const { data: reports, isLoading: reportsLoading, error: reportsError } = trpc.reports.getReports.useQuery(undefined, { enabled: Boolean(user) });
  const { data: unreviewedFlags, isLoading: flagsLoading, error: flagsError } = trpc.contentModeration.getUnreviewedFlags.useQuery(undefined, { enabled: Boolean(user) });

  const reviewFlagMutation = trpc.contentModeration.reviewFlag.useMutation({
    onSuccess: () => {
      toast.success("Flag reviewed successfully");
      utils.contentModeration.getUnreviewedFlags.invalidate();
    },
    onError: () => toast.error('Failed to review flag'),
  });

  const updateReportMutation = trpc.reports.updateReport.useMutation({
    onSuccess: () => {
      toast.success("Report status updated");
      utils.reports.getReports.invalidate();
    },
    onError: () => toast.error('Failed to update report'),
  });

  const banUserMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      toast.success("User status updated");
      utils.admin.getOnlineUsers.invalidate();
      utils.admin.listAllUsers.invalidate();
    },
    onError: () => toast.error('Failed to ban user'),
  });

  const setUserRoleMutation = trpc.admin.setUserRole.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`User role updated to ${variables.role}`);
      utils.admin.listAllUsers.invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to update user role'),
  });

  const createGroupMutation = trpc.admin.createGroup.useMutation({
    onSuccess: () => {
      toast.success("Group created successfully!");
      setNewGroupName("");
      setNewGroupDesc("");
      setNewGroupPass("");
      utils.admin.listGroups.invalidate();
      utils.groups.list.invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to create group'),
  });

  const deleteGroupMutation = trpc.admin.deleteGroup.useMutation({
    onSuccess: () => {
      toast.success("Group deleted permanently");
      utils.admin.listGroups.invalidate();
      utils.groups.list.invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to delete group'),
  });

  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    setLocation("/");
    return null;
  }

  const isSuperAdmin = user.role === "admin";

  const handleReviewFlag = async (flagId: number, verdict: "approved" | "rejected") => {
    await reviewFlagMutation.mutateAsync({ flagId, verdict });
  };

  const handleBanUser = async (userId: number) => {
    await banUserMutation.mutateAsync({
      userId,
      reason: "Moderation action from admin dashboard",
    });
  };

  const handleSetUserRole = async (userId: number, role: "user" | "moderator" | "admin") => {
    await setUserRoleMutation.mutateAsync({ userId, role });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    await createGroupMutation.mutateAsync({
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || undefined,
      password: newGroupPass.trim() || undefined,
    });
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (confirm(`Are you sure you want to permanently delete group "${groupName}"? All messages will be erased.`)) {
      await deleteGroupMutation.mutateAsync({ groupId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold text-white">
              {isSuperAdmin ? "Admin Dashboard" : "Staff / Co-Admin Dashboard"}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="text-gray-300 border-gray-500/50 hover:bg-gray-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-purple-500/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-purple-600">
              <FolderPlus className="w-4 h-4 mr-2" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 mr-2" />
              Staff & Users
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-purple-600">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="moderation" className="data-[state=active]:bg-purple-600">
              <Shield className="w-4 h-4 mr-2" />
              Moderation
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Online Users</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {stats?.onlineCount || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending Reports</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {reports?.filter((r: any) => r.status === "pending").length || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                </div>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Flagged Content</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {unreviewedFlags?.length || 0}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-red-400" />
                </div>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Moderation Queue</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {(reports?.filter((r: any) => r.status === "pending").length || 0) +
                        (unreviewedFlags?.length || 0)}
                    </p>
                  </div>
                  <Ban className="w-8 h-8 text-yellow-400" />
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <div>
                    <p className="text-white">New user registration</p>
                    <p className="text-gray-400 text-sm">5 minutes ago</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <div>
                    <p className="text-white">Report submitted</p>
                    <p className="text-gray-400 text-sm">12 minutes ago</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-white">User suspended</p>
                    <p className="text-gray-400 text-sm">28 minutes ago</p>
                  </div>
                  <Ban className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6 mt-6">
            <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-400" />
                Create New Group
              </h3>
              <form onSubmit={handleCreateGroup} className="space-y-4 max-w-xl">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Group Name *</label>
                  <Input
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="e.g. Gaming Lounge, Tech Discussions"
                    className="bg-slate-900/60 border-purple-500/30 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Description</label>
                  <Textarea
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    placeholder="What is this community group about?"
                    className="bg-slate-900/60 border-purple-500/30 text-white min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Password (Optional - Private Room)</label>
                  <Input
                    type="password"
                    value={newGroupPass}
                    onChange={e => setNewGroupPass(e.target.value)}
                    placeholder="Leave blank for public room"
                    className="bg-slate-900/60 border-purple-500/30 text-white"
                  />
                </div>
                <Button type="submit" disabled={createGroupMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </form>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">All Active Groups ({groupsList?.length || 0})</h3>
              {groupsLoading ? (
                <div className="text-gray-400">Loading groups...</div>
              ) : groupsList && groupsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupsList.map((g: any) => (
                    <div key={g.id} className="p-4 bg-slate-700/50 rounded-lg border border-purple-500/20 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-bold text-lg">{g.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${g.isPrivate ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                            {g.isPrivate ? "Private" : "Public"}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{g.description || "No description provided."}</p>
                        <p className="text-gray-400 text-xs mt-2">Members: {g.memberCount || 1}</p>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-purple-500/10">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteGroup(g.id, g.name)}
                          disabled={deleteGroupMutation.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Group
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No active groups found. Create one above!</p>
              )}
            </Card>
          </TabsContent>

          {/* Staff & Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">All Registered Users & Staff</h3>
              {allUsersLoading ? (
                <div className="text-gray-400">Loading user accounts...</div>
              ) : allUsers && allUsers.length > 0 ? (
                <div className="space-y-3">
                  {allUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-purple-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {(u.name || u.username || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold">{u.name || u.username || `User #${u.id}`}</p>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              u.role === "admin"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : u.role === "moderator"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-gray-500/20 text-gray-300"
                            }`}>
                              {u.role === "admin" ? "Admin" : u.role === "moderator" ? "Staff / Co-Admin" : "User"}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">@{u.username || `user${u.id}`}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {u.role === "user" && (
                          <Button
                            size="sm"
                            onClick={() => handleSetUserRole(u.id, "moderator")}
                            disabled={setUserRoleMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <UserCog className="w-4 h-4 mr-1" />
                            Promote to Staff
                          </Button>
                        )}
                        {u.role === "moderator" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetUserRole(u.id, "user")}
                            disabled={setUserRoleMutation.isPending}
                            className="border-gray-500 text-gray-300 hover:bg-gray-700"
                          >
                            Demote to User
                          </Button>
                        )}
                        {isSuperAdmin && u.role !== "admin" && (
                          <Button
                            size="sm"
                            onClick={() => handleSetUserRole(u.id, "admin")}
                            disabled={setUserRoleMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            Make Admin
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleBanUser(u.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Ban
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No users found.</p>
              )}
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">User Reports</h3>
              <div className="space-y-3">
                {reports && reports.length > 0 ? (
                  reports.map((report: any) => (
                    <div
                      key={report.id}
                      className="p-4 bg-slate-700/50 rounded-lg border border-orange-500/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">
                            Report #{report.id} - {report.reason}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Reported user: {report.reportedUserName}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">{report.description}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            report.status === "pending"
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-green-500/20 text-green-300"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              updateReportMutation.mutateAsync({
                                reportId: report.id,
                                status: "resolved",
                                action: "ban",
                              })
                            }
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve & Ban
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateReportMutation.mutateAsync({
                                reportId: report.id,
                                status: "dismissed",
                              })
                            }
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No reports</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6 mt-6">
            <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Flagged Content</h3>
              <div className="space-y-3">
                {unreviewedFlags && unreviewedFlags.length > 0 ? (
                  unreviewedFlags.map((flag: any) => (
                    <div
                      key={flag.id}
                      className="p-4 bg-slate-700/50 rounded-lg border border-red-500/20"
                    >
                      <div className="mb-3">
                        <p className="text-white font-semibold">
                          {flag.flagReason} (Confidence: {(flag.aiConfidence * 100).toFixed(0)}%)
                        </p>
                        <p className="text-gray-300 text-sm mt-2 italic">"{flag.messageContent}"</p>
                        <p className="text-gray-400 text-xs mt-2">
                          Flagged by: LLM Moderation System
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReviewFlag(flag.id, "approved")}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReviewFlag(flag.id, "rejected")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Allow
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No flagged content</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
