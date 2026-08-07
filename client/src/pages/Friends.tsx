import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import NavigationLayout from "@/components/NavigationLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  Check,
  X,
  MessageCircle,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Friends() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"friends" | "requests" | "blocked">("friends");

  const { data: friendsList, isLoading: friendsLoading } =
    trpc.friends.getFriendsList.useQuery(undefined, { enabled: Boolean(user) });
  const { data: friendRequests, isLoading: requestsLoading } =
    trpc.friends.getFriendRequests.useQuery(undefined, { enabled: Boolean(user) });

  const acceptRequestMutation = trpc.friends.acceptRequest.useMutation({
    onError: () => toast.error("Failed to accept request"),
  });
  const rejectRequestMutation = trpc.friends.rejectRequest.useMutation({
    onError: () => toast.error("Failed to reject request"),
  });
  const removeFriendMutation = trpc.friends.removeFriend.useMutation({
    onError: () => toast.error("Failed to remove friend"),
  });

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleAcceptRequest = async (requestId: number) => {
    await acceptRequestMutation.mutateAsync({ requestId });
    await Promise.all([
      utils.friends.getFriendRequests.invalidate(),
      utils.friends.getFriendsList.invalidate(),
    ]);
    toast.success("Friend request accepted");
  };

  const handleRejectRequest = async (requestId: number) => {
    await rejectRequestMutation.mutateAsync({ requestId });
    await utils.friends.getFriendRequests.invalidate();
    toast.success("Friend request rejected");
  };

  const handleRemoveFriend = async (friendId: number) => {
    await removeFriendMutation.mutateAsync({ friendId });
    await utils.friends.getFriendsList.invalidate();
    toast.success("Friend removed");
  };

  const filteredFriends = friendsList?.filter((friend: any) =>
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avatarColors = [
    "from-emerald-500 to-cyan-500",
    "from-purple-600 to-pink-500",
    "from-blue-500 to-indigo-600",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-600",
  ];

  return (
    <NavigationLayout activeTab="people">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search people..."
            className="pl-10 bg-slate-900 border-slate-800 text-white text-xs placeholder-slate-500 rounded-xl h-11 focus:border-emerald-500"
          />
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex border-b border-slate-800 text-xs font-black uppercase tracking-wider">
          <button
            onClick={() => setActiveSubTab("friends")}
            className={`pb-3 px-4 border-b-2 transition-all ${
              activeSubTab === "friends"
                ? "border-emerald-500 text-emerald-400 font-black"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            YOUR FRIENDS ({friendsList?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab("requests")}
            className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === "requests"
                ? "border-emerald-500 text-emerald-400 font-black"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            FRIEND REQUESTS
            {friendRequests && friendRequests.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full font-black">
                [{friendRequests.length}]
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("blocked")}
            className={`pb-3 px-4 border-b-2 transition-all ${
              activeSubTab === "blocked"
                ? "border-emerald-500 text-emerald-400 font-black"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            BLOCKED PEOPLE
          </button>
        </div>

        {/* Content: Your Friends */}
        {activeSubTab === "friends" && (
          <div className="space-y-3">
            {friendsLoading ? (
              <div className="text-center py-8 text-slate-500 text-xs">Loading contacts...</div>
            ) : filteredFriends && filteredFriends.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredFriends.map((friend: any, idx: number) => {
                  const gradient = avatarColors[idx % avatarColors.length];
                  return (
                    <Card
                      key={friend.id}
                      className="bg-slate-900 border-slate-800 p-3.5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} text-white font-black flex items-center justify-center text-sm shadow-md`}>
                          {(friend.name || friend.username || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{friend.name || friend.username}</p>
                          <p className="text-xs text-slate-400">@{friend.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setLocation("/messages")}
                          className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs h-9 px-3 rounded-xl shadow-md shadow-emerald-950/40"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="text-slate-400 hover:text-rose-400 h-9 w-9 p-0 rounded-xl"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center rounded-2xl space-y-2">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-white font-bold text-sm">No friends added yet</p>
                <p className="text-slate-500 text-xs">Start chatting in public rooms or random chat to add contacts!</p>
              </Card>
            )}
          </div>
        )}

        {/* Content: Friend Requests */}
        {activeSubTab === "requests" && (
          <div className="space-y-3">
            {requestsLoading ? (
              <div className="text-center py-8 text-slate-500 text-xs">Loading requests...</div>
            ) : friendRequests && friendRequests.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {friendRequests.map((req: any, idx: number) => {
                  const gradient = avatarColors[idx % avatarColors.length];
                  return (
                    <Card
                      key={req.id}
                      className="bg-slate-900 border-slate-800 p-3.5 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} text-white font-black flex items-center justify-center text-sm shadow-md`}>
                          {(req.sender?.name || req.sender?.username || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{req.sender?.name || req.sender?.username}</p>
                          <p className="text-xs text-slate-400">Wants to add you as a friend</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(req.id)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs h-9 px-3 rounded-xl"
                        >
                          <Check className="w-4 h-4 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRejectRequest(req.id)}
                          className="text-slate-400 hover:text-rose-400 h-9 w-9 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center rounded-2xl space-y-2">
                <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-white font-bold text-sm">No pending friend requests</p>
              </Card>
            )}
          </div>
        )}

        {/* Content: Blocked People */}
        {activeSubTab === "blocked" && (
          <Card className="bg-slate-900 border-slate-800 p-8 text-center rounded-2xl space-y-2">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-white font-bold text-sm">No blocked users</p>
            <p className="text-slate-500 text-xs">Users you block will appear in this list.</p>
          </Card>
        )}
      </div>
    </NavigationLayout>
  );
}
