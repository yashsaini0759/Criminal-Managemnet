import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Edit, Trash2 } from "lucide-react";
import { AddOperatorModal } from "@/components/modals/add-operator-modal";
import { User } from "@shared/schema";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Operators() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const user = getCurrentUser();
  const { toast } = useToast();

  // Redirect if not admin
  if (!isAdmin(user)) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(id);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Operator Management</h2>
          <p className="text-muted-foreground">Manage system operators and their permissions</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-operator">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Operator
        </Button>
      </div>

      {/* Operators Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8" data-testid="text-no-users">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userItem: User) => (
                  <TableRow key={userItem.id} data-testid={`row-user-${userItem.id}`}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-primary text-sm font-medium">
                            {userItem.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{userItem.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {userItem.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{userItem.username}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(userItem.role)}>
                        {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {userItem.lastLogin
                        ? new Date(userItem.lastLogin).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(userItem.isActive)}>
                        {userItem.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-user-${userItem.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {userItem.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(userItem.id)}
                            data-testid={`button-delete-user-${userItem.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AddOperatorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
