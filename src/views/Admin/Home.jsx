export default function AdminHome() {
  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "20px" }}>
        Dashboard Overview
      </h2>

      <div className="admin-cards">
        <div className="admin-card">
          <p className="admin-card-label">Total Students</p>
          <p className="admin-card-value">0</p>
        </div>

        <div className="admin-card">
          <p className="admin-card-label">Total Teachers</p>
          <p className="admin-card-value">0</p>
        </div>

        <div className="admin-card">
          <p className="admin-card-label">Pending Requests</p>
          <p className="admin-card-value">0</p>
        </div>
      </div>
    </div>
  );
}
