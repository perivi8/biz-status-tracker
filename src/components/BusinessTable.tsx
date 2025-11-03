import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export type StatusType = "green" | "red" | "yellow" | "";

export interface Business {
  id: number;
  businessName: string;
  phone: string;
  email: string;
  businessType: string;
  comment: string;
  status: StatusType;
}

const initialBusinesses: Business[] = [
  {
    id: 1,
    businessName: "Tech Solutions Inc",
    phone: "+1 234-567-8900",
    email: "contact@techsolutions.com",
    businessType: "Technology",
    comment: "Key client for enterprise solutions",
    status: "green",
  },
  {
    id: 2,
    businessName: "Creative Agency",
    phone: "+1 234-567-8901",
    email: "hello@creativeagency.com",
    businessType: "Marketing",
    comment: "Pending contract renewal",
    status: "yellow",
  },
  {
    id: 3,
    businessName: "Global Traders",
    phone: "+1 234-567-8902",
    email: "info@globaltraders.com",
    businessType: "Import/Export",
    comment: "Payment overdue",
    status: "red",
  },
];

const BusinessTable = () => {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  const getRowClass = (status: StatusType) => {
    switch (status) {
      case "green":
        return "bg-success-light hover:bg-success-light/80 transition-colors";
      case "yellow":
        return "bg-warning-light hover:bg-warning-light/80 transition-colors";
      case "red":
        return "bg-danger-light hover:bg-danger-light/80 transition-colors";
      default:
        return "hover:bg-muted/50 transition-colors";
    }
  };

  const handleStatusChange = (id: number, newStatus: StatusType) => {
    setBusinesses(businesses.map(b => 
      b.id === id ? { ...b, status: newStatus } : b
    ));
    toast.success("Status updated successfully");
  };

  const handleEdit = (business: Business) => {
    setEditingBusiness(business);
    setIsAddMode(false);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingBusiness({
      id: Math.max(...businesses.map(b => b.id), 0) + 1,
      businessName: "",
      phone: "",
      email: "",
      businessType: "",
      comment: "",
      status: "",
    });
    setIsAddMode(true);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingBusiness) return;

    if (isAddMode) {
      setBusinesses([...businesses, editingBusiness]);
      toast.success("Business added successfully");
    } else {
      setBusinesses(businesses.map(b => 
        b.id === editingBusiness.id ? editingBusiness : b
      ));
      toast.success("Business updated successfully");
    }
    setIsDialogOpen(false);
    setEditingBusiness(null);
  };

  const handleDelete = (id: number) => {
    setBusinesses(businesses.filter(b => b.id !== id));
    toast.success("Business deleted successfully");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Business Directory</h2>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Business
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">S.No</TableHead>
              <TableHead className="font-semibold">Business Name</TableHead>
              <TableHead className="font-semibold">Phone Number</TableHead>
              <TableHead className="font-semibold">Email Address</TableHead>
              <TableHead className="font-semibold">Business Type</TableHead>
              <TableHead className="font-semibold">Comment</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.map((business, index) => (
              <TableRow key={business.id} className={getRowClass(business.status)}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{business.businessName}</TableCell>
                <TableCell>{business.phone}</TableCell>
                <TableCell>{business.email}</TableCell>
                <TableCell>{business.businessType}</TableCell>
                <TableCell className="max-w-xs truncate">{business.comment}</TableCell>
                <TableCell>
                  <Select
                    value={business.status}
                    onValueChange={(value) => handleStatusChange(business.id, value as StatusType)}
                  >
                    <SelectTrigger className="w-32 bg-card">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(business)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(business.id)}
                      className="h-8 w-8 text-danger hover:text-danger hover:bg-danger-light"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle>{isAddMode ? "Add New Business" : "Edit Business"}</DialogTitle>
            <DialogDescription>
              {isAddMode ? "Fill in the details to add a new business." : "Update the business information below."}
            </DialogDescription>
          </DialogHeader>
          {editingBusiness && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={editingBusiness.businessName}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, businessName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editingBusiness.phone}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingBusiness.email}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  value={editingBusiness.businessType}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, businessType: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={editingBusiness.comment}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, comment: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isAddMode ? "Add Business" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessTable;
