import { useAuth } from "@/_core/hooks/useAuth";
import NavigationLayout from "@/components/NavigationLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getAnonymousSession } from "@/lib/anonymous-session";
import {
  Check,
  Loader2,
  Plus,
  Search,
  Users,
  X,
  Shuffle,
  ArrowRight,
  Link,
  Lock,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Groups() {
  const { user, loading } = useAuth();
  const isAnonymous = Boolean(getAnonymousSession());
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeSegment, setActiveSegment] = useState<"all" | "my">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [searchingCount, setSearchingCount] = useState(0);
  const utils = trpc.useUtils();

  const groupsQuery = trpc.groups.list.useQuery(undefined, {
    enabled: Boolean(user) || isAnonymous,
  });
  const invitesQuery = trpc.groups.getInvites.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const createGroup = trpc.groups.create.useMutation({
    onError: error => toast.error(error.message || "Group creation failed"),
  });
  const respondToInvite = trpc.groups.respondToInvite.useMutation({
    onError: error => toast.error(error.message || "Invitation update failed"),
  });

  useEffect(() => {
    if (!loading && !user && !isAnonymous)
      navigate("/guest-login", { replace: true });
  }, [isAnonymous, loading, navigate, user]);

  useEffect(() => {
    if (!user && !isAnonymous) return;
    const socket = io(window.location.origin, {
      auth: { mode: user ? "authenticated" : "anonymous" },
      transports: ["websocket", "polling"],
      timeout: 15_000,
      reconnectionAttempts: 5,
    });
    socket.on("stats:matching-queue", data => {
      if (
        data?.context === "random_matching_queue" &&
        data?.matchingState === "SEARCHING"
      ) {
        setSearchingCount(Number(data?.counts?.text) || 0);
      }
    });
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [isAnonymous, user?.id]);

  const filteredGroups = useMemo(() => {
    let list = groupsQuery.data ?? [];
    if (activeSegment === "my" && user) {
      list = list.filter(
        g =>
          g.currentRole === "admin" ||
          g.currentRole === "co_admin" ||
          g.currentRole === "moderator" ||
          g.createdBy === user.id
      );
    }
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      group =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
    );
  }, [groupsQuery.data, search, activeSegment, user]);

  if (loading || (!user && !isAnonymous)) return null;

  const handleCreate = async () => {
    try {
      const group = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        password: password.trim() || undefined,
      });
      setName("");
      setDescription("");
      setPassword("");
      setCreateOpen(false);
      await utils.groups.list.invalidate();
      navigate(`/groups/${group.id}`);
    } catch {
      // Error handled
    }
  };

  const handleInvite = async (inviteId: number, accept: boolean) => {
    try {
      const result = await respondToInvite.mutateAsync({ inviteId, accept });
      await Promise.all([
        utils.groups.getInvites.invalidate(),
        utils.groups.list.invalidate(),
        utils.notifications.getNotifications.invalidate(),
        utils.notifications.getUnreadCount.invalidate(),
      ]);
      if (accept) {
        toast.success("Group joined");
        navigate(`/groups/${result.groupId}`);
      } else {
        toast.success("Invitation declined");
      }
    } catch {
      // Error handled
    }
  };

  const handleCopyGroupLink = (groupId: number) => {
    const url = `${window.location.origin}/groups/${groupId}`;
    navigator.clipboard.writeText(url);
    toast.success("Group link copied to clipboard");
  };

  return (
    <NavigationLayout activeTab="rooms">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Header Segmented Switcher & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          {/* Segmented Tab Switcher */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveSegment("all")}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-black text-xs tracking-wider transition-all ${
                activeSegment === "all"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-950/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Rooms
            </button>
            <button
              onClick={() => setActiveSegment("my")}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-black text-xs tracking-wider transition-all ${
                activeSegment === "my"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-950/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              My Rooms
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chat rooms..."
              className="pl-9 bg-slate-950 border-slate-800 text-white text-xs placeholder-slate-500 rounded-xl focus:border-emerald-500"
            />
          </div>

          {/* Create Room Modal Trigger */}
          {user && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs px-4 rounded-xl shadow-md shadow-emerald-950/40">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-white">
                    Create New Chat Room
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">
                      Room Name
                    </label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. 🐝 Telugu Chat Lounge, Tech & Gaming"
                      className="bg-slate-950 border-slate-800 text-white text-sm focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">
                      Topic / Description
                    </label>
                    <Textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Topic - Be friendly, share ideas & connect!"
                      className="bg-slate-950 border-slate-800 text-white text-sm h-24 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">
                      Password (Optional)
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Leave blank for public room"
                      className="bg-slate-950 border-slate-800 text-white text-sm focus:border-emerald-500"
                    />
                  </div>
                  <Button
                    disabled={!name.trim() || createGroup.isPending}
                    onClick={handleCreate}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm min-h-11 shadow-md shadow-emerald-950/50"
                  >
                    {createGroup.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create Chat Room"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Featured Random Chat Hero Banner */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/70 border border-emerald-500/40 p-6 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
                <Shuffle className="w-3.5 h-3.5" />
                Featured Experience
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Random Chat 🎲
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                We'll connect you instantly to a completely random stranger.
                Enjoy the randomness safely online.
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                {searchingCount} searching now
              </div>

              <Button
                onClick={() => navigate("/random-chat")}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/50 flex-1 md:flex-none"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                START CHAT
              </Button>
            </div>
          </div>
        </Card>

        {/* Group Invites Section */}
        {invitesQuery.data && invitesQuery.data.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">
              Pending Room Invitations ({invitesQuery.data.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {invitesQuery.data.map(inv => (
                <Card
                  key={inv.id}
                  className="bg-slate-900 border-slate-800 p-4 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-white text-sm">
                      {inv.groupName}
                    </p>
                    <p className="text-xs text-slate-400">
                      Invited by @{inv.inviterUsername || "member"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleInvite(inv.id, true)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-black h-8 px-3 text-xs"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Join
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInvite(inv.id, false)}
                      className="text-slate-400 hover:text-rose-400 h-8 px-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Community Group Rooms List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              Group Chat - Featured
            </h3>
            <span className="text-xs text-slate-500">
              {filteredGroups.length} rooms active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredGroups.map(group => (
              <Card
                key={group.id}
                className="bg-slate-900 border-slate-800 hover:border-emerald-500/40 p-4 sm:p-5 rounded-2xl transition-all duration-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                      {group.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                        {group.name}
                        {(group as any).isPrivate && (
                          <span className="text-xs bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {group.description || "Welcome to the group chat!"}
                      </p>
                    </div>
                  </div>

                  {group.description && (
                    <div className="text-xs text-emerald-400/90 bg-emerald-950/30 border border-emerald-500/20 px-3 py-1 rounded-lg">
                      <span className="font-bold">Topic</span> -{" "}
                      {group.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-slate-800 pt-3 sm:pt-0">
                  {/* Live Member Count Pill */}
                  <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{group.memberCount || 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs px-4 h-9 rounded-xl shadow-md shadow-emerald-950/40"
                    >
                      OPEN
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="text-slate-400 hover:text-white h-9 w-9 p-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyGroupLink(group.id)}
                      className="text-slate-400 hover:text-emerald-400 h-9 w-9 p-0"
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {filteredGroups.length === 0 && (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center rounded-2xl">
                <p className="text-slate-400 text-sm">
                  No chat rooms found matching your search.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </NavigationLayout>
  );
}
