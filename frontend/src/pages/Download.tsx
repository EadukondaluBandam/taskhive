const Download = () => {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <section
        style={{
          width: "min(560px, 100%)",
          border: "1px solid #cbd5e1",
          borderRadius: "16px",
          padding: "24px",
          background: "#ffffff",
          boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)"
        }}
      >
        <h1 style={{ marginTop: 0 }}>Download TaskHive Desktop</h1>
        <p>Choose the desktop build based on your role.</p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
          <a
            href="/downloads/TaskHive-Admin.exe"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: 600
            }}
          >
            Download Admin App
          </a>
          <a
            href="/downloads/TaskHive-Employee.exe"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#0f766e",
              color: "#ffffff",
              fontWeight: 600
            }}
          >
            Download Employee App
          </a>
        </div>
      </section>
    </main>
  );
};

export default Download;
