import { useSession, signOut } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
  
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          textAlign: "center",
        }}
      >
        <h1>Dashboard</h1>
        <p>Welcome {session?.user?.name || "User"}</p>
      </div>
    </div>
  );
}

