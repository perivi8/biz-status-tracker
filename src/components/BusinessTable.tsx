import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Plus, Search, SortAsc, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export type StatusType = "green" | "red" | "yellow" | "";

export interface Business {
  id: number;
  businessName: string;
  phone: string;
  businessType: string;
  comment: string;
  status: StatusType;
  createdAt?: string;
}

const API_URL = "https://leads-backend-mntd.onrender.com/api";

const BusinessTable = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<number | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [businessToUpdateStatus, setBusinessToUpdateStatus] = useState<Business | null>(null);
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date-new" | "date-old" | "none">("date-new");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Fetch businesses from backend
  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch(`${API_URL}/businesses`);
      const data = await response.json();
      if (data.status === 'success') {
        setBusinesses(data.data);
        toast.success("Data loaded from MongoDB");
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort businesses
  const filteredBusinesses = businesses
    .filter(business => {
      const matchesName = business.businessName.toLowerCase().includes(searchName.toLowerCase());
      const matchesPhone = business.phone.includes(searchPhone);
      return matchesName && matchesPhone;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.businessName.localeCompare(b.businessName);
      } else if (sortBy === "date-new") {
        // Handle missing dates - put items without dates at the end
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "date-old") {
        // Handle missing dates - put items without dates at the end
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchPhone, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBusinesses = filteredBusinesses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "green":
        return "bg-emerald-50 border-l-4 border-emerald-500";
      case "yellow":
        return "bg-amber-50 border-l-4 border-amber-500";
      case "red":
        return "bg-rose-50 border-l-4 border-rose-500";
      default:
        return "bg-white border-l-4 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status: StatusType) => {
    switch (status) {
      case "green":
        return "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "yellow":
        return "bg-amber-100 text-amber-700 border border-amber-300";
      case "red":
        return "bg-rose-100 text-rose-700 border border-rose-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const handleStatusClick = (business: Business) => {
    setBusinessToUpdateStatus(business);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async (newStatus: StatusType) => {
    if (!businessToUpdateStatus) return;

    try {
      const response = await fetch(`${API_URL}/businesses/${businessToUpdateStatus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...businessToUpdateStatus, status: newStatus })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setBusinesses(businesses.map(b => 
          b.id === businessToUpdateStatus.id ? { ...b, status: newStatus } : b
        ));
        toast.success("Status updated successfully");
        setStatusDialogOpen(false);
        setBusinessToUpdateStatus(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Failed to update status");
    }
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
      businessType: "",
      comment: "",
      status: "",
      createdAt: new Date().toISOString(),
    });
    setIsAddMode(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingBusiness) return;

    // Validate phone number is not empty
    if (!editingBusiness.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    // Check for duplicate phone number
    const duplicatePhone = businesses.find(
      b => b.phone === editingBusiness.phone && b.id !== editingBusiness.id
    );

    if (duplicatePhone) {
      toast.error("Mobile number already exists");
      return;
    }

    setIsSaving(true);
    try {
      if (isAddMode) {
        const response = await fetch(`${API_URL}/businesses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingBusiness)
        });

        const data = await response.json();
        if (data.status === 'success') {
          await fetchBusinesses();
          toast.success("Business added to MongoDB");
        }
      } else {
        const response = await fetch(`${API_URL}/businesses/${editingBusiness.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingBusiness)
        });

        const data = await response.json();
        if (data.status === 'success') {
          await fetchBusinesses();
          toast.success("Business updated in MongoDB");
        }
      }
      setIsDialogOpen(false);
      setEditingBusiness(null);
    } catch (error) {
      console.error('Error saving business:', error);
      toast.error("Failed to save business");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setBusinessToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (businessToDelete === null) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/businesses/${businessToDelete}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.status === 'success') {
        await fetchBusinesses();
        toast.success("Business deleted from MongoDB");
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      toast.error("Failed to delete business");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setBusinessToDelete(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading businesses from MongoDB...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Business Directory</h2>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Business
        </Button>
      </div>

      {/* Filter Section */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="searchName" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search by Business Name
            </Label>
            <Input
              id="searchName"
              placeholder="Enter business name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="searchPhone" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search by Mobile Number
            </Label>
            <Input
              id="searchPhone"
              placeholder="Enter mobile number..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortBy" className="flex items-center gap-2">
              <SortAsc className="h-4 w-4" />
              Sort By
            </Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "date-new" | "date-old" | "none")}>
              <SelectTrigger id="sortBy" className="w-full">
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="name">Business Name (A-Z)</SelectItem>
                <SelectItem value="date-new">Date Created (Newest First)</SelectItem>
                <SelectItem value="date-old">Date Created (Oldest First)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {(searchName || searchPhone || sortBy !== "none") && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredBusinesses.length)} of {filteredBusinesses.length} filtered businesses (Total: {businesses.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchName("");
                setSearchPhone("");
                setSortBy("none");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
        {!(searchName || searchPhone || sortBy !== "none") && filteredBusinesses.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredBusinesses.length)} of {filteredBusinesses.length} businesses
            </p>
          </div>
        )}
      </div>

      {/* Modern Card-Based Table Design */}
      <div className="space-y-3">
        {/* Table Header - Hidden on Mobile */}
        <div className="hidden md:block bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-10 gap-4 text-white font-semibold text-sm">
            <div className="col-span-1 text-center">S.No</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2">Business Name</div>
            <div className="col-span-1">Phone</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-2">Comment</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-2">
          {filteredBusinesses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-500 text-lg">No businesses found</p>
            </div>
          ) : (
            paginatedBusinesses.map((business, index) => (
              <div
                key={business.id}
                className={`${getStatusColor(business.status)} rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-3 md:p-4 group animate-in fade-in slide-in-from-bottom-4 duration-300`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs">
                        {startIndex + index + 1}
                      </span>
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{business.businessName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {business.createdAt
                            ? new Date(business.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: '2-digit',
                              })
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusClick(business)}
                      className={`${getStatusBadgeColor(business.status)} px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap`}
                    >
                      {business.status === "green" ? "Interested" : business.status === "yellow" ? "Hold" : business.status === "red" ? "Not Interested" : "Set"}
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs font-medium">Phone:</span>
                      <a href={`tel:${business.phone}`} className="text-blue-600 font-medium hover:text-blue-800 hover:underline">{business.phone}</a>
                    </div>
                    {business.businessType && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-medium">Type:</span>
                        <span className="text-gray-600">{business.businessType}</span>
                      </div>
                    )}
                    {business.comment && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 text-xs font-medium">Note:</span>
                        <span className="text-gray-600 text-xs line-clamp-2">{business.comment}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(business)}
                      className="flex-1 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(business.id)}
                      className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-10 gap-4 items-center">
                  {/* S.No */}
                  <div className="col-span-1 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-sm">
                      {startIndex + index + 1}
                    </span>
                  </div>

                  {/* Date Created */}
                  <div className="col-span-1">
                    <div className="text-xs text-gray-600 font-medium antialiased tracking-wide">
                      {business.createdAt
                        ? new Date(business.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit',
                          })
                        : 'N/A'}
                    </div>
                  </div>

                  {/* Business Name */}
                  <div className="col-span-2">
                    <div className="font-semibold text-gray-900 text-sm truncate antialiased tracking-tight">
                      {business.businessName}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="col-span-1">
                    <a href={`tel:${business.phone}`} className="text-sm text-blue-600 font-semibold hover:text-blue-800 hover:underline antialiased tracking-wide">
                      {business.phone}
                    </a>
                  </div>

                  {/* Business Type */}
                  <div className="col-span-1">
                    <div className="text-xs text-gray-700 truncate antialiased tracking-wide font-medium">
                      {business.businessType || '-'}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="col-span-2">
                    <div className="text-xs text-gray-700 truncate antialiased tracking-wide" title={business.comment}>
                      {business.comment || '-'}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => handleStatusClick(business)}
                      className={`${getStatusBadgeColor(business.status)} px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 shadow-sm whitespace-nowrap`}
                    >
                      {business.status === "green" ? "Interested" : business.status === "yellow" ? "Hold" : business.status === "red" ? "Not Interested" : "Set Status"}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="col-span-1 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(business)}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(business.id)}
                      className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination Controls - Bottom */}
      {filteredBusinesses.length > itemsPerPage && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2 border-slate-300 p-3 md:p-4 shadow-md mt-4">
          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {/* Page Info */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {itemsPerPage} rows/page
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="h-10 px-3 text-xs font-medium flex-1 max-w-[70px]"
              >
                First
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10 w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers - Show 3 on mobile */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage === 1) {
                    pageNum = i + 1;
                  } else if (currentPage === totalPages) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="h-10 w-10 p-0 font-semibold text-sm"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-10 w-10 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-10 px-3 text-xs font-medium flex-1 max-w-[70px]"
              >
                Last
              </Button>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:flex flex-row items-center justify-between gap-4">
            <div className="text-sm font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="h-9 px-3 font-medium"
              >
                First
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers - Show 5 on desktop */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="h-9 w-9 p-0 font-semibold"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-9 px-3 font-medium"
              >
                Last
              </Button>
            </div>

            <div className="text-sm font-semibold text-slate-700">
              {itemsPerPage} rows per page
            </div>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="space-y-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`p-2 md:p-3 rounded-xl ${isAddMode ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                {isAddMode ? (
                  <Plus className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
                ) : (
                  <Edit className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg md:text-2xl font-bold text-slate-800">
                  {isAddMode ? "Add New Business" : "Edit Business Details"}
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm text-slate-600 mt-1">
                  {isAddMode ? "Enter the business information to add to your directory." : "Update the business information below."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {editingBusiness && (
            <div className="grid gap-4 md:gap-6 py-4 md:py-6 px-1">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-1 md:gap-2">
                  <span className="text-emerald-600">●</span> Business Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="Enter business name"
                  value={editingBusiness.businessName}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, businessName: e.target.value })}
                  className="border-2 border-slate-200 focus:border-emerald-500 transition-colors h-10 md:h-11 text-sm"
                />
              </div>

              {/* Phone and Type in Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-1 md:gap-2">
                    <span className="text-blue-600">●</span> Phone Number
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={editingBusiness.phone}
                    onChange={(e) => {
                      // Remove all spaces from the input
                      let cleanedValue = e.target.value.replace(/\s/g, '');
                      // Remove leading zeros
                      cleanedValue = cleanedValue.replace(/^0+/, '');
                      setEditingBusiness({ ...editingBusiness, phone: cleanedValue });
                    }}
                    className="border-2 border-slate-200 focus:border-blue-500 transition-colors h-10 md:h-11 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType" className="text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-1 md:gap-2">
                    <span className="text-purple-600">●</span> Business Type
                  </Label>
                  <Input
                    id="businessType"
                    placeholder="e.g., Supermarket, Restaurant"
                    value={editingBusiness.businessType}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, businessType: e.target.value })}
                    className="border-2 border-slate-200 focus:border-purple-500 transition-colors h-10 md:h-11 text-sm"
                  />
                </div>
              </div>

              {/* Comment - Only show in Edit Mode */}
              {!isAddMode && (
                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-1 md:gap-2">
                    <span className="text-rose-600">●</span> Comment / Notes
                  </Label>
                  <Textarea
                    id="comment"
                    placeholder="Add any additional notes or comments..."
                    value={editingBusiness.comment}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, comment: e.target.value })}
                    rows={3}
                    className="border-2 border-slate-200 focus:border-rose-500 transition-colors resize-none text-sm"
                  />
                </div>
              )}

              {/* Status Selection - Only show in Edit Mode */}
              {!isAddMode && (
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-1 md:gap-2">
                    <span className="text-indigo-600">●</span> Status
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingBusiness({ ...editingBusiness, status: "green" })}
                      className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-lg border-2 transition-all font-medium text-sm ${
                        editingBusiness.status === "green"
                          ? "bg-emerald-100 border-emerald-500 text-emerald-700 shadow-md"
                          : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
                      }`}
                    >
                      Interested
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBusiness({ ...editingBusiness, status: "yellow" })}
                      className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-lg border-2 transition-all font-medium text-sm ${
                        editingBusiness.status === "yellow"
                          ? "bg-amber-100 border-amber-500 text-amber-700 shadow-md"
                          : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
                      }`}
                    >
                      Hold
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBusiness({ ...editingBusiness, status: "red" })}
                      className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-lg border-2 transition-all font-medium text-sm ${
                        editingBusiness.status === "red"
                          ? "bg-rose-100 border-rose-500 text-rose-700 shadow-md"
                          : "bg-white border-slate-200 text-slate-600 hover:border-rose-300"
                      }`}
                    >
                      Not Interested
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="pt-3 md:pt-4 border-t border-slate-200 gap-2 md:gap-3 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 md:px-6 h-10 md:h-11 border-2 hover:bg-slate-100 text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full sm:w-auto px-6 md:px-8 h-10 md:h-11 font-semibold shadow-lg text-sm ${
                isAddMode 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isAddMode ? "Adding..." : "Saving..."}
                </>
              ) : (
                isAddMode ? "Add Business" : "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white to-red-50 border-2 border-red-200 animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="space-y-2 pb-3 border-b border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-100">
                <Trash2 className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold text-slate-800">Confirm Delete</DialogTitle>
                <DialogDescription className="text-xs md:text-sm text-slate-600 mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4 md:py-6">
            <p className="text-sm md:text-base text-slate-700">
              Are you sure you want to delete this business? All information will be permanently removed from the database.
            </p>
          </div>

          <DialogFooter className="gap-2 md:gap-3 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto px-4 md:px-6 h-10 md:h-11 border-2 hover:bg-slate-100 text-sm order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full sm:w-auto px-4 md:px-6 h-10 md:h-11 font-semibold text-sm order-1 sm:order-2 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Business"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="space-y-2 pb-3 border-b border-slate-200">
            <DialogTitle className="text-xl font-bold text-slate-800">Update Status</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {businessToUpdateStatus && (
                <span>Change status for <strong>{businessToUpdateStatus.businessName}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-3">
            <button
              onClick={() => handleStatusChange("green")}
              className={`w-full py-4 px-4 rounded-xl border-2 transition-all font-semibold text-base flex items-center justify-between ${
                businessToUpdateStatus?.status === "green"
                  ? "bg-emerald-100 border-emerald-500 text-emerald-700 shadow-lg"
                  : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              <span>Interested</span>
              <span className="w-4 h-4 rounded-full bg-emerald-500"></span>
            </button>
            
            <button
              onClick={() => handleStatusChange("yellow")}
              className={`w-full py-4 px-4 rounded-xl border-2 transition-all font-semibold text-base flex items-center justify-between ${
                businessToUpdateStatus?.status === "yellow"
                  ? "bg-amber-100 border-amber-500 text-amber-700 shadow-lg"
                  : "bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50"
              }`}
            >
              <span>Hold</span>
              <span className="w-4 h-4 rounded-full bg-amber-500"></span>
            </button>
            
            <button
              onClick={() => handleStatusChange("red")}
              className={`w-full py-4 px-4 rounded-xl border-2 transition-all font-semibold text-base flex items-center justify-between ${
                businessToUpdateStatus?.status === "red"
                  ? "bg-rose-100 border-rose-500 text-rose-700 shadow-lg"
                  : "bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50"
              }`}
            >
              <span>Not Interested</span>
              <span className="w-4 h-4 rounded-full bg-rose-500"></span>
            </button>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200">
            <Button 
              variant="outline" 
              onClick={() => {
                setStatusDialogOpen(false);
                setBusinessToUpdateStatus(null);
              }}
              className="w-full h-10 border-2 hover:bg-slate-100"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessTable;
