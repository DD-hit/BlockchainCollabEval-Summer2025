// ... existing code ...
<>
  <Route 
    path="/dashboard" 
    element={
      <AntdDashboard user={user}>
        <DashboardContent />
      </AntdDashboard>
    } 
  />
  <Route 
    path="/projects/*" 
    element={
      <BlankLayout>
        <ProjectRoutes />
      </BlankLayout>
    }
  />
</>