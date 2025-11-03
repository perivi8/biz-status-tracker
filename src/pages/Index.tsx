import BusinessTable from "@/components/BusinessTable";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Business Management System</h1>
          <p className="text-muted-foreground mt-2">Track and manage your business contacts</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <BusinessTable />
      </main>
    </div>
  );
};

export default Index;
